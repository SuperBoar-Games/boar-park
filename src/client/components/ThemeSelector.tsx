// Theme selector dropdown component for switching between Catppuccin color schemes

import React from 'react';
import { useTheme } from './ThemeProvider';
import { Select } from './Select';

const themeIcons: Record<string, string> = {
    mocha: '🌙',
    macchiato: '🌆',
    frappe: '❄️',
    latte: '☀️'
};

export function ThemeSelector() {
    const { theme, setTheme } = useTheme();

    return (
        <div className="theme-selector" data-theme={theme}>
            <label htmlFor="theme-select" className="theme-label">
                Theme:
            </label>
            <Select
                value={theme}
                onChange={(value) => setTheme(value as any)}
                options={[
                    { value: 'mocha', label: `${themeIcons.mocha} Mocha`, icon: themeIcons.mocha },
                    { value: 'macchiato', label: `${themeIcons.macchiato} Macchiato`, icon: themeIcons.macchiato },
                    { value: 'frappe', label: `${themeIcons.frappe} Frappé`, icon: themeIcons.frappe },
                    { value: 'latte', label: `${themeIcons.latte} Latte`, icon: themeIcons.latte },
                ]}
            />
        </div>
    );
}
