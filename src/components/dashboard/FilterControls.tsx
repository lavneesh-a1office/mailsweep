'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface FilterControlsProps {
  ageFilter: string;
  onAgeFilterChange: (newFilter: string) => void;
}

export default function FilterControls({ ageFilter, onAgeFilterChange }: FilterControlsProps) {
  return (
    <Card className="shadow-lg bg-card">
      <CardHeader>
        <CardTitle>Filters</CardTitle>
        <CardDescription>Fine-tune your email selection.</CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup value={ageFilter} onValueChange={onAgeFilterChange}>
          <p className="mb-3 text-sm font-medium">Delete emails older than:</p>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="1y" id="1y" />
              <Label htmlFor="1y" className="cursor-pointer">1 Year</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="3y" id="3y" />
              <Label htmlFor="3y" className="cursor-pointer">3 Years</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="all" id="all" />
              <Label htmlFor="all" className="cursor-pointer">All Time</Label>
            </div>
          </div>
        </RadioGroup>
      </CardContent>
    </Card>
  );
}
