import { Plus, Edit, Trash2, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navbar from "@/components/shared/Navbar";

const RestaurantMenu = () => {
  const [menuItems, setMenuItems] = useState([
    {
      id: "1",
      name: "Classic Cheeseburger",
      description: "Angus beef patty with aged cheddar, lettuce, tomato, onion, and house sauce",
      price: 12.99,
      category: "Burgers",
      image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&h=200&fit=crop",
      available: true,
      popular: true
    },
    {
      id: "2",
      name: "BBQ Bacon Burger", 
      description: "Double patty with crispy bacon, BBQ sauce, onion rings, and cheddar cheese",
      price: 16.99,
      category: "Burgers",
      image: "https://images.unsplash.com/photo-1553979459-d2229ba7433a?w=300&h=200&fit=crop",
      available: true,
      popular: true
    },
    {
      id: "3",
      name: "Truffle Fries",
      description: "Hand-cut fries with truffle oil and parmesan cheese",
      price: 8.99,
      category: "Sides",
      image: "https://images.unsplash.com/photo-1576107232684-1279f390859f?w=300&h=200&fit=crop",
      available: true,
      popular: false
    },
    {
      id: "4",
      name: "Mushroom Swiss Burger",
      description: "Sautéed mushrooms, Swiss cheese, and garlic aioli on brioche bun",
      price: 14.99,
      category: "Burgers",
      image: "https://images.unsplash.com/photo-1551782450-17144efb9c50?w=300&h=200&fit=crop",
      available: false,
      popular: false
    }
  ]);

  const [editingItem, setEditingItem] = useState<any>(null);
  const [showDialog, setShowDialog] = useState(false);

  const categories = ["Burgers", "Sides", "Drinks", "Desserts"];

  const toggleAvailability = (itemId: string) => {
    setMenuItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, available: !item.available } : item
    ));
  };

  const deleteItem = (itemId: string) => {
    setMenuItems(prev => prev.filter(item => item.id !== itemId));
  };

  const saveItem = (itemData: any) => {
    if (editingItem) {
      // Update existing item
      setMenuItems(prev => prev.map(item => 
        item.id === editingItem.id ? { ...item, ...itemData } : item
      ));
    } else {
      // Add new item
      const newItem = {
        ...itemData,
        id: Date.now().toString(),
      };
      setMenuItems(prev => [...prev, newItem]);
    }
    setEditingItem(null);
    setShowDialog(false);
  };

  const openEditDialog = (item?: any) => {
    setEditingItem(item || null);
    setShowDialog(true);
  };

  const filterItemsByCategory = (category: string) => {
    if (category === "all") return menuItems;
    return menuItems.filter(item => item.category === category);
  };

  const ItemForm = () => {
    const [formData, setFormData] = useState({
      name: editingItem?.name || "",
      description: editingItem?.description || "",
      price: editingItem?.price || "",
      category: editingItem?.category || "Burgers",
      image: editingItem?.image || "",
      available: editingItem?.available ?? true,
      popular: editingItem?.popular ?? false
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      saveItem({
        ...formData,
        price: parseFloat(formData.price.toString())
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
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="category">Category</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="image">Image URL</Label>
            <Input
              id="image"
              type="url"
              value={formData.image}
              onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Switch
              id="available"
              checked={formData.available}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, available: checked }))}
            />
            <Label htmlFor="available">Available</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="popular"
              checked={formData.popular}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, popular: checked }))}
            />
            <Label htmlFor="popular">Popular Item</Label>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
            Cancel
          </Button>
          <Button type="submit" className="bg-uber-green hover:bg-uber-green-hover">
            {editingItem ? "Update Item" : "Add Item"}
          </Button>
        </div>
      </form>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar type="restaurant" />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Menu Management</h1>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => openEditDialog()}
                className="bg-uber-green hover:bg-uber-green-hover"
              >
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
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">All Items ({menuItems.length})</TabsTrigger>
            {categories.map(category => (
              <TabsTrigger key={category} value={category.toLowerCase()}>
                {category} ({filterItemsByCategory(category).length})
              </TabsTrigger>
            ))}
          </TabsList>
          
          <TabsContent value="all" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {menuItems.map((item) => (
                <Card key={item.id} className={`shadow-card ${!item.available ? 'opacity-60' : ''}`}>
                  <div className="relative">
                    <img 
                      src={item.image} 
                      alt={item.name}
                      className="w-full h-48 object-cover rounded-t-lg"
                    />
                    <div className="absolute top-3 right-3 flex gap-2">
                      {item.popular && (
                        <Badge className="bg-uber-green hover:bg-uber-green-hover">
                          Popular
                        </Badge>
                      )}
                      {!item.available && (
                        <Badge variant="destructive">
                          Unavailable
                        </Badge>
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
                    
                    <Badge variant="secondary" className="mb-4">
                      {item.category}
                    </Badge>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Switch 
                          checked={item.available}
                          onCheckedChange={() => toggleAvailability(item.id)}
                        />
                        <span className="text-sm">
                          {item.available ? (
                            <span className="flex items-center gap-1 uber-green">
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
                          onClick={() => deleteItem(item.id)}
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
          
          {categories.map(category => (
            <TabsContent key={category} value={category.toLowerCase()} className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filterItemsByCategory(category).map((item) => (
                  <Card key={item.id} className={`shadow-card ${!item.available ? 'opacity-60' : ''}`}>
                    <div className="relative">
                      <img 
                        src={item.image} 
                        alt={item.name}
                        className="w-full h-48 object-cover rounded-t-lg"
                      />
                      <div className="absolute top-3 right-3 flex gap-2">
                        {item.popular && (
                          <Badge className="bg-uber-green hover:bg-uber-green-hover">
                            Popular
                          </Badge>
                        )}
                        {!item.available && (
                          <Badge variant="destructive">
                            Unavailable
                          </Badge>
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
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Switch 
                            checked={item.available}
                            onCheckedChange={() => toggleAvailability(item.id)}
                          />
                          <span className="text-sm">
                            {item.available ? (
                              <span className="flex items-center gap-1 uber-green">
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
                            onClick={() => deleteItem(item.id)}
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
    </div>
  );
};

export default RestaurantMenu;