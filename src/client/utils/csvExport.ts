/**
 * CSV Export Utilities
 * Provides functions to generate and download CSV files
 */

export interface CardExportData {
    movie: string;
    card_name: string;
    card_type: string;
    call_sign: string;
    ability_text: string;
    ability_text2: string;
}

export interface HeroExportData {
    heroName: string;
    cards: CardExportData[];
}

/**
 * Convert hero data to CSV format
 */
export function generateHeroCSV(data: HeroExportData): string {
    const lines: string[] = [];

    // Header
    lines.push('movie,card_name,card_type,call_sign,ability_text,ability_text2');

    // Cards
    data.cards.forEach((card) => {
        lines.push(
            `"${escapeCSV(card.movie)}","${escapeCSV(card.card_name)}","${escapeCSV(card.card_type)}","${escapeCSV(card.call_sign)}","${escapeCSV(card.ability_text)}","${escapeCSV(card.ability_text2)}"`
        );
    });

    return lines.join('\n');
}

/**
 * Escape CSV field values
 */
function escapeCSV(value: string): string {
    if (!value) return '';
    // Escape quotes by doubling them
    return value.replace(/"/g, '""');
}

/**
 * Download CSV file to user's computer
 */
export function downloadCSV(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Generate hero CSV and download it
 */
export function exportHeroToCSV(data: HeroExportData): void {
    const csv = generateHeroCSV(data);
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `hero_${data.heroName.replace(/\s+/g, '_')}_${timestamp}.csv`;
    downloadCSV(csv, filename);
}
