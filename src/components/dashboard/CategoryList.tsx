
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tag, Users, Bell, MessageSquare, ShoppingCart, Plane, Folder, Eye } from "lucide-react";
import type { Category } from "./MailSweepDashboard";
import Link from "next/link";

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
        <CardDescription>Select categories or preview emails.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        {allCategories.map(category => {
          const count = categoryCounts[category] || 0;
          const Icon = categoryIcons[category];
          const isSelected = selectedCategories[category];

          return (
            <div 
              key={category} 
              className={`flex items-center justify-between p-2 rounded-lg transition-colors ${isSelected ? 'bg-primary/20' : 'hover:bg-accent/10'}`}
            >
              <div 
                className="flex items-center gap-4 flex-grow cursor-pointer"
                onClick={() => handleCategoryToggle(category)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCategoryToggle(category) }}
                aria-pressed={isSelected}
              >
                <Checkbox 
                  id={category} 
                  checked={isSelected}
                  aria-labelledby={`label-${category}`}
                  className="ml-1"
                />
                <Icon className="h-5 w-5 text-muted-foreground" />
                <Label id={`label-${category}`} htmlFor={category} className="font-medium cursor-pointer">{category}</Label>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={isSelected ? "default" : "secondary"} className={`w-16 justify-center ${isSelected ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'}`}>{count.toLocaleString()}</Badge>
                <Link href={`/dashboard/preview/${category}`} passHref legacyBehavior>
                  <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <a>
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">Preview {category}</span>
                    </a>
                  </Button>
                </Link>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
