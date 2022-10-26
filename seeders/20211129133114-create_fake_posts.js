'use strict';
const faker = require('faker');

module.exports = {
    up: async(queryInterface, Sequelize) => {
        let posts = [];

        for (let i = 0; i < 25; i++) {
            posts.push({
                id: faker.datatype.uuid(),
                userId: faker.datatype.uuid(),
                title: faker.lorem.sentence(),
                content: faker.lorem.sentence(),
                attachmentUrl: faker.internet.url(),
                createdAt: new Date(),
                updatedAt: new Date(),
            });
        };
        await queryInterface.bulkInsert('Posts', posts, {})
    },

    down: async(queryInterface, Sequelize) => {
        await queryInterface.bulkDelete('Posts', null, {});
    }
};