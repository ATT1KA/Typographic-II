import { Router } from 'express';
import TypographyController from '../controllers/typography.controller';

const router = Router();
const typographyController = new TypographyController();

router.get('/typography', typographyController.getTypography.bind(typographyController));
router.put('/typography/:id', typographyController.updateTypography.bind(typographyController));

export default router;