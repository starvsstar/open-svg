"use client";

import { FC } from 'react';
import Editor from '@monaco-editor/react';
import { useTheme } from 'next-themes';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export const CodeEditor: FC<CodeEditorProps> = ({ value, onChange }) => {
  const { theme: systemTheme } = useTheme();

  return (
    <Editor
      height="100%"
      defaultLanguage="xml"
      value={value}
      onChange={(value) => onChange(value || '')}
      theme={systemTheme === 'dark' ? 'vs-dark' : 'light'}
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        automaticLayout: true,
        padding: { top: 16, bottom: 16 },
      }}
    />
  );
}; 