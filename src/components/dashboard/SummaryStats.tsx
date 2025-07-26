
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScanLine, Trash, HardDrive, CircleHelp, Separator } from "lucide-react";

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
            <CardHeader>
                <CardTitle>Scan Summary</CardTitle>
                <CardDescription>A quick overview of your inbox analysis.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col md:flex-row justify-around items-center text-center">
                    {stats.map((stat, index) => (
                        <React.Fragment key={stat.title}>
                            <div className="flex flex-col items-center p-4 w-full">
                                <stat.icon className="h-6 w-6 text-muted-foreground mb-2" />
                                <p className="text-2xl font-bold text-primary">{stat.value}</p>
                                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                            </div>
                            {index < stats.length - 1 && (
                                <Separator orientation="vertical" className="h-16 hidden md:block" />
                            )}
                            {index < stats.length - 1 && (
                                <Separator orientation="horizontal" className="w-full my-2 md:hidden" />
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
