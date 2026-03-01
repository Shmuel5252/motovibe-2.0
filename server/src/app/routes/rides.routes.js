const router = require('express').Router();
const { body } = require('express-validator');

const authMiddleware = require('../middlewares/auth.middleware');
const { startRide, stopRide, getActiveRide, getRideHistory, updateRide, deleteRide } = require('../controllers/rides.controller');

router.use(authMiddleware);

router.post(
    '/start',
    body('routeId').optional({ nullable: true, checkFalsy: true }).isMongoId(),
    startRide
);

router.post('/stop', stopRide);

router.get('/active', getActiveRide);
router.get('/history', getRideHistory);

router.patch(
    '/:id',
    body('name').optional({ checkFalsy: true }).isString().trim().isLength({ max: 60 }),
    body('imageUrl').optional({ checkFalsy: true }).isString().trim(),
    updateRide
);

router.delete('/:id', deleteRide);

module.exports = router;