const express = require('express');
const router = express.Router();
const nivelAcessoController = require('../controllers/nivelAcessoController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware); // Protege todas as rotas

router.post('/', nivelAcessoController.create);
router.get('/', nivelAcessoController.list);
router.get('/:id', nivelAcessoController.getById);
router.put('/:id', nivelAcessoController.update);
router.delete('/:id', nivelAcessoController.delete);

module.exports = router;