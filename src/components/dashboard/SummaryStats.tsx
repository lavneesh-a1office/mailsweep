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
            title: "Emails Scanned",
            value: emailsScanned.toLocaleString(),
            icon: ScanLine,
        },
        {
            title: "Ready to Delete",
            value: emailsToDelete.toLocaleString(),
            icon: Trash,
        },
        {
            title: "Space to be Freed",
            value: spaceToFree,
            icon: HardDrive,
        },
        {
            title: "Total Inbox Size",
            value: "N/A",
            icon: CircleHelp,
        }
    ];

    return (
        <Card className="shadow-lg bg-card">
            <CardContent className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    {stats.map((stat, index) => (
                        <div key={stat.title} className="flex flex-col items-center justify-center p-2 rounded-lg">
                            <stat.icon className="h-5 w-5 text-muted-foreground mb-2" />
                            <p className="text-lg font-bold text-primary">{stat.value}</p>
                            <p className="text-xs font-medium text-muted-foreground">{stat.title}</p>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}