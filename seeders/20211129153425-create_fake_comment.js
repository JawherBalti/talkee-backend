'use strict';
const faker = require('faker');

module.exports = {
    up: async(queryInterface, Sequelize) => {
        let comments = [];

        for (let i = 0; i < 25; i++) {
            comments.push({
                id: faker.datatype.uuid(),
                userId: faker.datatype.uuid(),
                postId: faker.datatype.uuid(),
                message: faker.lorem.sentence(),
                createdAt: new Date(),
                updatedAt: new Date(),
            });
        };
        await queryInterface.bulkInsert('Comments', comments, {})
    },

    down: async(queryInterface, Sequelize) => {
        await queryInterface.bulkDelete('Comments', null, {});
    }
};