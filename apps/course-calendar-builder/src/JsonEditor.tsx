import Editor, { type OnChange } from "@monaco-editor/react";
import type * as monacoEditor from "monaco-editor";
import type React from "react";
import { useRef } from "react";

interface JsonEditorProps {
	jsonData: string;
	setJsonData: (value: string) => void;
}

const JsonEditor: React.FC<JsonEditorProps> = ({ jsonData, setJsonData }) => {
	const editorRef = useRef<monacoEditor.editor.IStandaloneCodeEditor>();

	const handleEditorChange: OnChange = (value) => {
		if (value !== undefined) {
			setJsonData(value);
			// editorRef.current?.getAction('editor.action.formatDocument')?.run();
		}
	};

	const editorOptions = {
		minimap: { enabled: false },
		automaticLayout: true,
	};

	const handleEditorDidMount = (
		editor: monacoEditor.editor.IStandaloneCodeEditor,
	) => {
		editorRef.current = editor;
		editor.getAction("editor.action.formatDocument")?.run();
	};

	return (
		<div className="h-full">
			<Editor
				height="100%"
				defaultLanguage="json"
				value={jsonData}
				onChange={handleEditorChange}
				theme="vs-dark"
				options={editorOptions}
				onMount={handleEditorDidMount}
			/>
		</div>
	);
};

export default JsonEditor;
