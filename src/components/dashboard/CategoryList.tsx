'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tag, Users, Bell, MessageSquare, ShoppingCart, Plane, Folder } from "lucide-react";
import type { Category } from "./MailSweepDashboard";

const categoryIcons: Record<Category, React.ElementType> = {
  Promotions: Tag,
  Social: Users,
  Updates: Bell,
  Forums: MessageSquare,
  Purchases: ShoppingCart,
  Travel: Plane,
  Other: Folder,
};

interface CategoryListProps {
  categoryCounts: Record<Category, number>;
  selectedCategories: Record<Category, boolean>;
  onCategoryChange: (newSelected: Record<Category, boolean>) => void;
}

export default function CategoryList({ categoryCounts, selectedCategories, onCategoryChange }: CategoryListProps) {
  const allCategories = Object.keys(categoryIcons) as Category[];

  const handleCategoryToggle = (category: Category) => {
    onCategoryChange({
      ...selectedCategories,
      [category]: !selectedCategories[category],
    });
  };

  return (
    <Card className="shadow-lg bg-card">
      <CardHeader>
        <CardTitle>Categories</CardTitle>
        <CardDescription>Select categories to include in the deletion.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {allCategories.map(category => {
          const count = categoryCounts[category] || 0;
          const Icon = categoryIcons[category];
          const isSelected = selectedCategories[category];

          return (
            <div 
              key={category} 
              className={`flex items-center justify-between p-3 rounded-lg transition-colors cursor-pointer ${isSelected ? 'bg-primary/20' : 'hover:bg-accent/10'}`}
              onClick={() => handleCategoryToggle(category)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCategoryToggle(category) }}
              aria-pressed={isSelected}
            >
              <div className="flex items-center gap-4">
                <Checkbox 
                  id={category} 
                  checked={isSelected}
                  aria-labelledby={`label-${category}`}
                />
                <Icon className="h-5 w-5 text-muted-foreground" />
                <Label id={`label-${category}`} htmlFor={category} className="font-medium cursor-pointer">{category}</Label>
              </div>
              <Badge variant={isSelected ? "default" : "secondary"} className={`${isSelected ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'}`}>{count.toLocaleString()}</Badge>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
