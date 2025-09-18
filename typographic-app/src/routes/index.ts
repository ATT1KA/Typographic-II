import { Router } from 'express';
import TypographyController from '../controllers/typography.controller';

const router = Router();
const typographyController = new TypographyController();

router.get('/typography', typographyController.getTypography);
router.post('/typography', typographyController.createTypography);
router.put('/typography/:id', typographyController.updateTypography);
router.delete('/typography/:id', typographyController.deleteTypography);

export default router;