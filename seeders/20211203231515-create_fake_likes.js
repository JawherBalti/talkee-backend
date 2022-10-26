'use strict';
const faker = require('faker');

module.exports = {
    up: async(queryInterface, Sequelize) => {
        let likes = [];

        for (let i = 0; i < 25; i++) {
            likes.push({
                //id: faker.datatype.uuid(),
                userId: faker.datatype.uuid(),
                postId: faker.datatype.uuid(),
                isLike: faker.datatype.number({ min: -1, max: 1 }),
                createdAt: new Date(),
                updatedAt: new Date(),
            })
        };
        await queryInterface.bulkInsert('Likes', likes, {})
    },

    down: async(queryInterface, Sequelize) => {
        await queryInterface.bulkDelete('Likes', null, {});
    }
};