
'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScanLine, Trash, HardDrive, CircleHelp } from "lucide-react";

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
            description: "Total emails analyzed in your inbox."
        },
        {
            title: "Ready to Delete",
            value: emailsToDelete.toLocaleString(),
            icon: Trash,
            description: "Emails matching your current filter selection."
        },
        {
            title: "Space to be Freed",
            value: spaceToFree,
            icon: HardDrive,
            description: "Estimated space you'll reclaim."
        },
        {
            title: "Total Inbox Size",
            value: "N/A",
            icon: CircleHelp,
            description: "Gmail API does not provide this information directly."
        }
    ];

    return (
        <Card className="shadow-lg bg-card">
            <CardHeader>
                <CardTitle>Scan Summary</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {stats.map(stat => (
                        <Card key={stat.title} className="bg-background/50">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                                <stat.icon className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-primary">{stat.value}</div>
                                <p className="text-xs text-muted-foreground pt-1">{stat.description}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
