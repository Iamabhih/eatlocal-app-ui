import { Plus, Edit, Trash2, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RestaurantLayout } from "@/components/restaurant/RestaurantLayout";
import { useRestaurantMenuItems } from "@/hooks/useRestaurantData";
import { useMenuCategories } from "@/hooks/useMenuItems";
import { useMenuMutations } from "@/hooks/useMenuMutations";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const RestaurantMenu = () => {
  const { user } = useAuth();
  const { data: menuItemsData, isLoading } = useRestaurantMenuItems();
  const { data: categories } = useMenuCategories(user?.id || '');
  const { createMenuItem, updateMenuItem, deleteMenuItem } = useMenuMutations();
  const [editingItem, setEditingItem] = useState<any>(null);
  const [showDialog, setShowDialog] = useState(false);
  const { toast } = useToast();

  const menuItems = menuItemsData || [];
  const menuCategories = categories || [];

  const toggleAvailability = async (item: any) => {
    try {
      await updateMenuItem.mutateAsync({
        id: item.id,
        is_available: !item.is_available,
      });
      toast({
        title: "Success",
        description: `Item ${!item.is_available ? 'enabled' : 'disabled'}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      await deleteMenuItem.mutateAsync(itemId);
      toast({
        title: "Success",
        description: "Item deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const saveItem = async (itemData: any) => {
    try {
      if (editingItem) {
        await updateMenuItem.mutateAsync({
          id: editingItem.id,
          ...itemData,
        });
        toast({
          title: "Success",
          description: "Item updated successfully",
        });
      } else {
        await createMenuItem.mutateAsync(itemData);
        toast({
          title: "Success",
          description: "Item created successfully",
        });
      }
      setEditingItem(null);
      setShowDialog(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (item?: any) => {
    setEditingItem(item || null);
    setShowDialog(true);
  };

  const filterItemsByCategory = (categoryId: string) => {
    if (categoryId === "all") return menuItems;
    return menuItems.filter((item: any) => item.category_id === categoryId);
  };

  const ItemForm = () => {
    const [formData, setFormData] = useState({
      name: editingItem?.name || "",
      description: editingItem?.description || "",
      price: editingItem?.price || "",
      category_id: editingItem?.category_id || menuCategories[0]?.id || "",
      image_url: editingItem?.image_url || "",
      is_available: editingItem?.is_available ?? true,
      is_vegetarian: editingItem?.is_vegetarian ?? false,
      is_vegan: editingItem?.is_vegan ?? false,
      is_gluten_free: editingItem?.is_gluten_free ?? false,
      preparation_time: editingItem?.preparation_time || 15,
      calories: editingItem?.calories || "",
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      saveItem({
        ...formData,
        price: parseFloat(formData.price.toString()),
        calories: formData.calories ? parseInt(formData.calories.toString()) : null,
      });
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Item Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>
          <div>
            <Label htmlFor="price">Price ($)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="category">Category</Label>
            <Select value={formData.category_id} onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {menuCategories.map((category: any) => (
                  <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="image_url">Image URL</Label>
            <Input
              id="image_url"
              type="url"
              value={formData.image_url}
              onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="preparation_time">Prep Time (minutes)</Label>
            <Input
              id="preparation_time"
              type="number"
              value={formData.preparation_time}
              onChange={(e) => setFormData(prev => ({ ...prev, preparation_time: parseInt(e.target.value) }))}
            />
          </div>
          <div>
            <Label htmlFor="calories">Calories</Label>
            <Input
              id="calories"
              type="number"
              value={formData.calories}
              onChange={(e) => setFormData(prev => ({ ...prev, calories: e.target.value }))}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="available"
              checked={formData.is_available}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_available: checked }))}
            />
            <Label htmlFor="available">Available</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="vegetarian"
              checked={formData.is_vegetarian}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_vegetarian: checked }))}
            />
            <Label htmlFor="vegetarian">Vegetarian</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="vegan"
              checked={formData.is_vegan}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_vegan: checked }))}
            />
            <Label htmlFor="vegan">Vegan</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="gluten_free"
              checked={formData.is_gluten_free}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_gluten_free: checked }))}
            />
            <Label htmlFor="gluten_free">Gluten Free</Label>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
            Cancel
          </Button>
          <Button type="submit">
            {editingItem ? "Update Item" : "Add Item"}
          </Button>
        </div>
      </form>
    );
  };

  if (isLoading) {
    return (
      <RestaurantLayout>
        <div className="flex items-center justify-center min-h-screen">
          <p>Loading menu...</p>
        </div>
      </RestaurantLayout>
    );
  }

  return (
    <RestaurantLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Menu Management</h1>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button onClick={() => openEditDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Add New Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? "Edit Menu Item" : "Add New Menu Item"}
                </DialogTitle>
              </DialogHeader>
              <ItemForm />
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${menuCategories.length + 1}, 1fr)` }}>
            <TabsTrigger value="all">All Items ({menuItems.length})</TabsTrigger>
            {menuCategories.map((category: any) => (
              <TabsTrigger key={category.id} value={category.id}>
                {category.name} ({filterItemsByCategory(category.id).length})
              </TabsTrigger>
            ))}
          </TabsList>
          
          <TabsContent value="all" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {menuItems.map((item: any) => (
                <Card key={item.id} className={`${!item.is_available ? 'opacity-60' : ''}`}>
                  <div className="relative">
                    <img 
                      src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&h=200&fit=crop'} 
                      alt={item.name}
                      className="w-full h-48 object-cover rounded-t-lg"
                    />
                    <div className="absolute top-3 right-3 flex gap-2">
                      {!item.is_available && (
                        <Badge variant="destructive">Unavailable</Badge>
                      )}
                    </div>
                  </div>
                  
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-lg">{item.name}</h3>
                      <span className="font-bold text-lg">${item.price}</span>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {item.description}
                    </p>
                    
                    <div className="flex gap-2 mb-3">
                      {item.is_vegetarian && <Badge variant="secondary">Vegetarian</Badge>}
                      {item.is_vegan && <Badge variant="secondary">Vegan</Badge>}
                      {item.is_gluten_free && <Badge variant="secondary">Gluten Free</Badge>}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Switch 
                          checked={item.is_available}
                          onCheckedChange={() => toggleAvailability(item)}
                        />
                        <span className="text-sm">
                          {item.is_available ? (
                            <span className="flex items-center gap-1">
                              <Eye className="h-4 w-4" />
                              Available
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <EyeOff className="h-4 w-4" />
                              Hidden
                            </span>
                          )}
                        </span>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          {menuCategories.map((category: any) => (
            <TabsContent key={category.id} value={category.id} className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filterItemsByCategory(category.id).map((item: any) => (
                  <Card key={item.id} className={`${!item.is_available ? 'opacity-60' : ''}`}>
                    <div className="relative">
                      <img 
                        src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&h=200&fit=crop'} 
                        alt={item.name}
                        className="w-full h-48 object-cover rounded-t-lg"
                      />
                      <div className="absolute top-3 right-3 flex gap-2">
                        {!item.is_available && (
                          <Badge variant="destructive">Unavailable</Badge>
                        )}
                      </div>
                    </div>
                    
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-lg">{item.name}</h3>
                        <span className="font-bold text-lg">${item.price}</span>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {item.description}
                      </p>
                      
                      <div className="flex gap-2 mb-3">
                        {item.is_vegetarian && <Badge variant="secondary">Vegetarian</Badge>}
                        {item.is_vegan && <Badge variant="secondary">Vegan</Badge>}
                        {item.is_gluten_free && <Badge variant="secondary">Gluten Free</Badge>}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Switch 
                            checked={item.is_available}
                            onCheckedChange={() => toggleAvailability(item)}
                          />
                          <span className="text-sm">
                            {item.is_available ? (
                              <span className="flex items-center gap-1">
                                <Eye className="h-4 w-4" />
                                Available
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <EyeOff className="h-4 w-4" />
                                Hidden
                              </span>
                            )}
                          </span>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(item)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteItem(item.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </RestaurantLayout>
  );
};

export default RestaurantMenu;