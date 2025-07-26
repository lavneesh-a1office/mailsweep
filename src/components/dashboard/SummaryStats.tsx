'use client';
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { ScanLine, Trash, HardDrive, CircleHelp } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface SummaryStatsProps {
    emailsScanned: number;
    emailsToDelete: number;
}

// Average email size in bytes for estimation (e.g., 75KB)
const AVG_EMAIL_SIZE_BYTES = 75 * 1024; 

function formatBytes(bytes: number, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export default function SummaryStats({ emailsScanned, emailsToDelete }: SummaryStatsProps) {
    const spaceToFree = formatBytes(emailsToDelete * AVG_EMAIL_SIZE_BYTES);

    const stats = [
        {
            title: "Scanned",
            value: emailsScanned.toLocaleString(),
            icon: ScanLine,
        },
        {
            title: "To Delete",
            value: emailsToDelete.toLocaleString(),
            icon: Trash,
        },
        {
            title: "To Free",
            value: spaceToFree,
            icon: HardDrive,
        }
    ];

    return (
        <Card className="shadow-lg bg-card overflow-hidden">
            <CardContent className="p-0">
                <div className="grid grid-cols-3 md:grid-cols-4 items-center">
                    <div className="hidden md:flex flex-col items-center justify-center p-4 text-center">
                        <ScanLine className="h-6 w-6 text-muted-foreground mb-2" />
                        <p className="text-2xl font-bold text-primary">{emailsScanned.toLocaleString()}</p>
                        <p className="text-sm font-medium text-muted-foreground">Emails Scanned</p>
                    </div>
                    <div className="hidden md:flex flex-col items-center justify-center p-4 text-center">
                        <Trash className="h-6 w-6 text-muted-foreground mb-2" />
                        <p className="text-2xl font-bold text-primary">{emailsToDelete.toLocaleString()}</p>
                        <p className="text-sm font-medium text-muted-foreground">Ready to Delete</p>
                    </div>
                    <div className="hidden md:flex flex-col items-center justify-center p-4 text-center">
                        <HardDrive className="h-6 w-6 text-muted-foreground mb-2" />
                        <p className="text-2xl font-bold text-primary">{spaceToFree}</p>
                        <p className="text-sm font-medium text-muted-foreground">Space to be Freed</p>
                    </div>
                    <div className="hidden md:flex flex-col items-center justify-center p-4 text-center bg-muted/50 h-full">
                         <CircleHelp className="h-6 w-6 text-muted-foreground mb-2" />
                        <p className="text-2xl font-bold text-primary">N/A</p>
                        <p className="text-sm font-medium text-muted-foreground">Total Inbox Size</p>
                    </div>
                    
                    {/* Mobile View */}
                    <div className="md:hidden col-span-3 flex justify-around items-center p-2 text-center">
                         {stats.map((stat, index) => (
                            <React.Fragment key={stat.title}>
                                <div className="flex flex-col items-center p-2">
                                    <stat.icon className="h-4 w-4 text-muted-foreground mb-1" />
                                    <p className="text-sm font-bold text-primary">{stat.value}</p>
                                    <p className="text-xs text-muted-foreground">{stat.title}</p>
                                </div>
                                {index < stats.length - 1 && <Separator orientation="vertical" className="h-8" />}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}