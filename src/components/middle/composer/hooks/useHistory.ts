import { useCallback, useEffect, useState } from '../../../../lib/teact/teact';

const useCustomContentEditableHistory = (updateInput: (str: string) => void) => {
  const [content, setContent] = useState('');
  const [, setHistoryStack] = useState<string[]>([]);
  const [isUndoing, setIsUndoing] = useState(false);

  const handleInputChange = useCallback((newContent: string) => {
    if (isUndoing) return;

    if (newContent !== content) {
      setHistoryStack((prevStack) => [...prevStack, content]);
      setContent(newContent);
    }
  }, [content, isUndoing]);

  const handleUndo = useCallback(() => {
    setIsUndoing(true);

    setHistoryStack((prevStack) => {
      if (prevStack.length === 0) return prevStack;
      const newStack = [...prevStack];
      const lastContent = newStack.pop();

      if (lastContent) {
        updateInput(lastContent);
      }

      setContent(lastContent || '');
      return newStack;
    });

    setTimeout(() => {
      setIsUndoing(false);
    }, 0);
  }, [updateInput]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        (event.metaKey || event.ctrlKey)
        && event.key.toLowerCase() === 'z'
      ) {
        event.preventDefault();
        handleUndo();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleUndo]);

  return {
    handleInputChange,
  };
};

export default useCustomContentEditableHistory;
