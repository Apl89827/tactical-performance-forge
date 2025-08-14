import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Pencil, Trash2, Plus, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ConjugateTemplate {
  id: string;
  template_type: string;
  name: string;
  config: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const ConjugateTemplateManager = () => {
  const [templates, setTemplates] = useState<ConjugateTemplate[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<ConjugateTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    template_type: 'variation_pools',
    name: '',
    config: '',
    is_active: true
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('conjugate_templates')
        .select('*')
        .order('template_type', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast({ title: 'Error fetching templates', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      let config;
      try {
        config = JSON.parse(formData.config);
      } catch {
        toast({ title: 'Invalid JSON configuration', variant: 'destructive' });
        return;
      }

      const templateData = {
        template_type: formData.template_type,
        name: formData.name,
        config,
        is_active: formData.is_active
      };

      if (editingTemplate) {
        const { error } = await supabase
          .from('conjugate_templates')
          .update(templateData)
          .eq('id', editingTemplate.id);
        
        if (error) throw error;
        toast({ title: 'Template updated successfully' });
      } else {
        const { error } = await supabase
          .from('conjugate_templates')
          .insert([templateData]);
        
        if (error) throw error;
        toast({ title: 'Template created successfully' });
      }

      setEditingTemplate(null);
      setIsCreating(false);
      setFormData({ template_type: 'variation_pools', name: '', config: '', is_active: true });
      fetchTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      toast({ title: 'Error saving template', variant: 'destructive' });
    }
  };

  const handleEdit = (template: ConjugateTemplate) => {
    setEditingTemplate(template);
    setFormData({
      template_type: template.template_type,
      name: template.name,
      config: JSON.stringify(template.config, null, 2),
      is_active: template.is_active
    });
    setIsCreating(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const { error } = await supabase
        .from('conjugate_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Template deleted successfully' });
      fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({ title: 'Error deleting template', variant: 'destructive' });
    }
  };

  const handleCancel = () => {
    setEditingTemplate(null);
    setIsCreating(false);
    setFormData({ template_type: 'variation_pools', name: '', config: '', is_active: true });
  };

  const getTemplatesByType = (type: string) => {
    return templates.filter(t => t.template_type === type);
  };

  const getDefaultConfig = (type: string) => {
    switch (type) {
      case 'variation_pools':
        return JSON.stringify({
          variations: [
            { name: "Exercise Name", category: "category", equipment: "equipment" }
          ]
        }, null, 2);
      case 'de_waves':
        return JSON.stringify({
          waves: [
            { week: 1, percent: 50, sets: 9, reps: 3 }
          ]
        }, null, 2);
      case 'accessory_categories':
        return JSON.stringify({
          categories: [
            { name: "Category Name", exercises: ["Exercise 1", "Exercise 2"] }
          ]
        }, null, 2);
      default:
        return '{}';
    }
  };

  const startCreating = (type: string) => {
    setIsCreating(true);
    setEditingTemplate(null);
    setFormData({
      template_type: type,
      name: '',
      config: getDefaultConfig(type),
      is_active: true
    });
  };

  if (loading) {
    return <div className="p-6">Loading templates...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Conjugate Templates</h2>
      </div>

      <Tabs defaultValue="variation_pools" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="variation_pools">Variation Pools</TabsTrigger>
          <TabsTrigger value="de_waves">DE Waves</TabsTrigger>
          <TabsTrigger value="accessory_categories">Accessories</TabsTrigger>
        </TabsList>

        <TabsContent value="variation_pools" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Variation Pools</h3>
            <Button onClick={() => startCreating('variation_pools')}>
              <Plus className="w-4 h-4 mr-2" />
              Add Pool
            </Button>
          </div>
          
          <div className="grid gap-4">
            {getTemplatesByType('variation_pools').map(template => (
              <Card key={template.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{template.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant={template.is_active ? "default" : "secondary"}>
                      {template.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(template)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(template.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {template.config.variations?.length || 0} variations
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="de_waves" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Dynamic Effort Waves</h3>
            <Button onClick={() => startCreating('de_waves')}>
              <Plus className="w-4 h-4 mr-2" />
              Add Wave
            </Button>
          </div>
          
          <div className="grid gap-4">
            {getTemplatesByType('de_waves').map(template => (
              <Card key={template.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{template.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant={template.is_active ? "default" : "secondary"}>
                      {template.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(template)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(template.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {template.config.waves?.length || 0} week progression
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="accessory_categories" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Accessory Categories</h3>
            <Button onClick={() => startCreating('accessory_categories')}>
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          </div>
          
          <div className="grid gap-4">
            {getTemplatesByType('accessory_categories').map(template => (
              <Card key={template.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{template.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant={template.is_active ? "default" : "secondary"}>
                      {template.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(template)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(template.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {template.config.categories?.length || 0} categories
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {(editingTemplate || isCreating) && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>
              {editingTemplate ? 'Edit Template' : 'Create Template'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Template Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter template name"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
            </div>

            <div>
              <Label htmlFor="config">Configuration (JSON)</Label>
              <Textarea
                id="config"
                value={formData.config}
                onChange={(e) => setFormData({ ...formData, config: e.target.value })}
                placeholder="Enter JSON configuration"
                rows={10}
                className="font-mono text-sm"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ConjugateTemplateManager;