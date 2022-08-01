const pick = require('lodash/pick');
const {
  ok, badRequest, error, notFound,
} = require('service-claire/helpers/responses');
const logger = require('service-claire/helpers/logger');
const {
  SUGGESTION_CREATED,
  SUGGESTION_CHOSEN,
  SUGGESTION_DELETED,
} = require('service-claire/events');
const {
  Suggestion,
} = require('../../models');

const validate = (/* suggestions */) => {
  return [];
};

const createSuggestion = async (req, res) => {
  const {
    messageUuid,
  } = req.params;
  const {
    accountId,
  } = req.user;
  const {
    uuid: integrationUuid,
  } = req.integration;
  const {
    chatUuid,
    suggestions,
  } = req.body;

  try {
    const errors = validate(suggestions);

    if (errors && errors.length > 0) {
      return badRequest(res)({
        reason: errors[0].message,
      });
    }

    const bulk = suggestions.map((suggestion) => {
      return {
        integrationUuid,
        accountId,
        chatUuid,
        messageUuid,
        text: suggestion.text,
        actions: suggestion.actions,
      };
    });

    const createdSuggestions = await Suggestion.bulkCreate(bulk, {
      returning: true,
    });
    const cleanSuggestions = createdSuggestions.map(s => pick(s, Suggestion.cleanAttributes));

    // send them over the MQ so that RTC can get them
    req.services.publish({
      event: SUGGESTION_CREATED,
      ts: new Date(),
      meta: {
        chatUuid,
        messageUuid,
        accountId,
        integrationUuid,
        clean: {
          suggestions: cleanSuggestions,
        },
      },
    });

    ok(res)({
      suggestions: cleanSuggestions,
    });
  } catch (err) {
    logger.error(err);
    error(res)(err);
  }
};

const chooseSuggestion = async (req, res) => {
  const { suggestionUuid } = req.params;
  const { uuid: userUuid, accountId } = req.user;
  const {
    actionValue,
  } = req.body;

  if (typeof actionValue !== 'string') {
    badRequest(res)({
      reason: 'Invalid action',
    });
    return;
  }

  try {
    const suggestion = await Suggestion.findOne({
      where: {
        uuid: suggestionUuid,
      },
      attributes: Suggestion.cleanAttributes,
    });

    // send the suggestion over the MQ so that Integrations can
    // send them off
    req.services.publish({
      event: SUGGESTION_CHOSEN,
      ts: new Date(),
      meta: {
        raw: {
          integrationUuid: suggestion.integrationUuid,
          accountId,
        },
        clean: {
          user: {
            uuid: userUuid,
          },
          suggestion,
          actionValue,
        },
      },
    });

    ok(res)(suggestion);
  } catch (err) {
    logger.error(err);
    error(res)(err);
  }
};

const getSuggestions = async (req, res) => {
  const { accountId } = req.user;
  const { messageUuid } = req.params;

  try {
    const suggestions = await Suggestion.findAll({
      where: {
        accountId,
        messageUuid,
      },
      attributes: Suggestion.cleanAttributes,
    });

    ok(res)({
      suggestions,
    });
  } catch (err) {
    logger.error(err);
    error(res)(err);
  }
};

/**
 * Integrations can only delete their own suggestions
 * @param {*} req
 * @param {*} res
 */
const deleteSuggestion = async (req, res) => {
  const { suggestionUuid } = req.params;
  const { accountId } = req.user;
  const { uuid: integrationUuid } = req.integration;

  try {
    const suggestion = await Suggestion.findOne({
      where: {
        integrationUuid,
        uuid: suggestionUuid,
      },
    });

    if (!suggestion) {
      notFound(res)();
      return;
    }

    await Suggestion.destroy({
      where: {
        integrationUuid,
        uuid: suggestionUuid,
      },
    });

    // send the suggestion over the MQ so that Integrations can
    // send them off
    req.services.publish({
      event: SUGGESTION_DELETED,
      ts: new Date(),
      meta: {
        raw: {
          accountId,
        },
        clean: {
          chatUuid: suggestion.chatUuid,
          messageUuid: suggestion.messageUuid,
          suggestionUuid,
        },
      },
    });

    ok(res)({});
  } catch (err) {
    logger.error(err);
    error(res)(err);
  }
};


module.exports = {
  createSuggestion,
  chooseSuggestion,
  getSuggestions,
  deleteSuggestion,
};
