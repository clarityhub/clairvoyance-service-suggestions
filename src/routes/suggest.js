const versionRouter = require('express-version-route');
const makeMap = require('service-claire/helpers/makeMap');
const authMiddleware = require('service-claire/middleware/auth');
const pubsubMiddleware = require('service-claire/middleware/publish');
const { integrationMiddleware } = require('service-claire/middleware/auth');
const cors = require('cors');
const { SUGGEST_CREATE } = require('service-claire/scopes');
const v1_0 = require('../v1_0/controllers/suggest');
const rateLimitMiddleware = require('../rate-limits');
const { createPublishSuggestions } = require('../v1_0/publications');

const pubsubSuggestionsMiddleware = pubsubMiddleware(createPublishSuggestions);

module.exports = (router) => {
  router.route('/messages/:messageUuid')
    .options(cors())
    .get(
      cors(),
      rateLimitMiddleware,
      authMiddleware,
      versionRouter.route(makeMap({
        '1.0': v1_0.getSuggestions,
        default: v1_0.getSuggestions,
      }))
    )
    .post(
      rateLimitMiddleware,
      integrationMiddleware(SUGGEST_CREATE),
      authMiddleware,
      pubsubSuggestionsMiddleware,
      versionRouter.route(makeMap({
        '1.0': v1_0.createSuggestion,
        default: v1_0.createSuggestion,
      }))
    );

  router.route('/:suggestionUuid')
    .options(cors())
    .post(
      cors(),
      rateLimitMiddleware,
      authMiddleware,
      pubsubSuggestionsMiddleware,
      versionRouter.route(makeMap({
        '1.0': v1_0.chooseSuggestion,
        default: v1_0.chooseSuggestion,
      }))
    )
    .delete(
      rateLimitMiddleware,
      integrationMiddleware(/* no scope needed */),
      authMiddleware,
      pubsubSuggestionsMiddleware,
      versionRouter.route(makeMap({
        '1.0': v1_0.deleteSuggestion,
        default: v1_0.deleteSuggestion,
      }))
    );
};
