// Theme selector dropdown — slate light/dark

import React from 'react';
import { useTheme } from './ThemeProvider';
import { Select } from './Select';

const themeIcons: Record<string, string> = {
    'slate-dark': '🌑',
    'slate-light': '☀️'
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
                    { value: 'slate-dark', label: `${themeIcons['slate-dark']} Dark`, icon: themeIcons['slate-dark'] },
                    { value: 'slate-light', label: `${themeIcons['slate-light']} Light`, icon: themeIcons['slate-light'] },
                ]}
            />
        </div>
    );
}
