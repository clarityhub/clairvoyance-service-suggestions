module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable(
      'Suggestions',
      {
        id: {
          type: Sequelize.BIGINT,
          primaryKey: true,
          autoIncrement: true,
        },

        accountId: {
          type: Sequelize.BIGINT,
          validate: {
            notEmpty: true,
          },
        },

        uuid: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          validate: {
            notEmpty: true,
          },
        },

        integrationUuid: {
          type: Sequelize.UUID,
          allowNull: false,
          validate: {
            notEmpty: true,
          },
        },

        chatUuid: {
          type: Sequelize.UUID,
          allowNull: false,
          validate: {
            notEmpty: true,
          },
        },

        messageUuid: {
          type: Sequelize.UUID,
          allowNull: false,
          validate: {
            notEmpty: true,
          },
        },

        text: {
          type: Sequelize.TEXT,
          allowNull: false,
          validate: {
            notEmpty: true,
          },
        },

        actions: {
          // JSON since it faster to insert
          type: Sequelize.JSON,
        },

        createdAt: Sequelize.DATE,
        updatedAt: Sequelize.DATE,
        deletedAt: Sequelize.DATE,
      }
    );
  },
  down: (queryInterface) => {
    return queryInterface.dropTable('Suggestions');
  },
};
