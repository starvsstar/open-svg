const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./swagger');

const app = express();

// Swagger文档路由
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// 确保这行在所有路由配置之后
module.exports = app; 