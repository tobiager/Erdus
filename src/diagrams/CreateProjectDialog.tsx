import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { useDiagramStore } from './store/diagramsStore';

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const createProjectSchema = z.object({
  name: z
    .string()
    .min(2, 'nameTooShort')
    .max(64, 'nameTooLong')
    .nonempty('nameRequired'),
  dialect: z.enum(['default', 'postgres', 'mysql', 'sqlserver', 'sqlite']),
  description: z.string().max(140, 'descriptionTooLong').optional(),
});

type CreateProjectForm = z.infer<typeof createProjectSchema>;

export default function CreateProjectDialog({
  open,
  onOpenChange,
}: CreateProjectDialogProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { createProject } = useDiagramStore();

  const [form, setForm] = useState<CreateProjectForm>({
    name: '',
    dialect: 'default',
    description: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      const validated = createProjectSchema.parse(form);
      const projectId = createProject(validated.name, validated.dialect, 'empty');
      
      // Reset form
      setForm({ name: '', dialect: 'default', description: '' });
      onOpenChange(false);
      
      // Navigate to the new project
      navigate(`/diagrams/${projectId}`);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.issues.forEach((issue) => {
          if (issue.path[0]) {
            newErrors[issue.path[0] as string] = t(`diagrams.validation.${issue.message}`);
          }
        });
        setErrors(newErrors);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFieldChange = (field: keyof CreateProjectForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('diagrams.createProject')}</DialogTitle>
          <DialogDescription>
            {t('diagrams.subtitle')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">{t('diagrams.projectName')}</Label>
            <Input
              id="name"
              type="text"
              value={form.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              placeholder={t('diagrams.name')}
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {errors.name}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="dialect">{t('diagrams.selectDialect')}</Label>
            <Select
              value={form.dialect}
              onValueChange={(value) => handleFieldChange('dialect', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('diagrams.selectDialect')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">
                  {t('diagrams.dialects.default')}
                </SelectItem>
                <SelectItem value="postgres">
                  {t('diagrams.dialects.postgres')}
                </SelectItem>
                <SelectItem value="mysql">
                  {t('diagrams.dialects.mysql')}
                </SelectItem>
                <SelectItem value="sqlserver">
                  {t('diagrams.dialects.sqlserver')}
                </SelectItem>
                <SelectItem value="sqlite">
                  {t('diagrams.dialects.sqlite')}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t('diagrams.description')}</Label>
            <Input
              id="description"
              type="text"
              value={form.description}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              placeholder={t('diagrams.description')}
              className={errors.description ? 'border-red-500' : ''}
            />
            {errors.description && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {errors.description}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              {t('diagrams.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? '...' : t('diagrams.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}