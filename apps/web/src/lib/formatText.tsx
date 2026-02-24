import React from 'react';

/**
 * 格式化文本，处理换行符和列表项
 * 支持：
 * - \n 换行
 * - 数字列表 (1. xxx 2. xxx 或 1) xxx 2) xxx)
 * - 项目符号列表 (- * •)
 * - 智能分割：识别句子中的列表项
 * - Markdown加粗：**文字**
 */
export function formatText(text: string): React.ReactNode {
  if (!text) return null;

  // 首先按换行符分割
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let currentParagraph: string[] = [];

  const flushParagraph = (index: number) => {
    if (currentParagraph.length > 0) {
      const paragraphText = currentParagraph.join(' ');
      // 检查段落是否包含内联列表
      const formatted = formatInlineList(paragraphText, index);
      if (formatted) {
        elements.push(...formatted);
      } else {
        elements.push(
          <p key={`p-${index}`} className="leading-relaxed">
            {parseMarkdown(paragraphText)}
          </p>
        );
      }
      currentParagraph = [];
    }
  };

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    
    // 空行，结束当前段落
    if (!trimmedLine) {
      flushParagraph(index);
      return;
    }

    // 检测已经格式化的数字列表 (行首是 1. 或 1) 或 1、)
    const numberListMatch = trimmedLine.match(/^(\d+)[.、)]\s*(.+)$/);
    if (numberListMatch) {
      flushParagraph(index);
      elements.push(
        <div key={`num-${index}`} className="flex gap-2 items-start">
          <span className="font-medium text-gray-700 flex-shrink-0 min-w-[1.5rem]">
            {numberListMatch[1]}.
          </span>
          <span className="flex-1">{parseMarkdown(numberListMatch[2])}</span>
        </div>
      );
      return;
    }

    // 检测项目符号列表 (- * •)
    const bulletMatch = trimmedLine.match(/^[-*•]\s+(.+)$/);
    if (bulletMatch) {
      flushParagraph(index);
      elements.push(
        <div key={`bullet-${index}`} className="flex gap-2 items-start">
          <span className="text-gray-700 flex-shrink-0">•</span>
          <span className="flex-1">{parseMarkdown(bulletMatch[1])}</span>
        </div>
      );
      return;
    }

    // 普通文本，累积到当前段落
    currentParagraph.push(trimmedLine);
  });

  // 处理最后的段落
  flushParagraph(lines.length);

  return (
    <div className="space-y-2">
      {elements}
    </div>
  );
}

/**
 * 解析Markdown格式（加粗）
 */
function parseMarkdown(text: string): React.ReactNode {
  // 匹配 **文字** 格式
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  const boldRegex = /\*\*(.+?)\*\*/g;
  let match;
  let key = 0;

  while ((match = boldRegex.exec(text)) !== null) {
    // 添加加粗前的普通文本
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    // 添加加粗文本
    parts.push(
      <strong key={`bold-${key++}`} className="font-semibold text-gray-900">
        {match[1]}
      </strong>
    );
    lastIndex = match.index + match[0].length;
  }

  // 添加剩余的普通文本
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

/**
 * 格式化内联列表
 * 识别文本中的 "1. xxx 2. xxx 3. xxx" 或 "1) xxx 2) xxx" 格式
 */
function formatInlineList(text: string, baseIndex: number): React.ReactNode[] | null {
  // 检测是否包含数字列表模式
  // 更宽松的匹配: 1. 或 1) 或 1、 后面跟内容，直到遇到下一个数字列表标记或结束
  const listItemRegex = /(\d+)[.、)]\s*(.+?)(?=\s*\d+[.、)]|\s*$)/g;
  const matches = Array.from(text.matchAll(listItemRegex));
  
  if (matches.length < 2) {
    // 如果匹配少于2项，可能不是列表
    return null;
  }

  // 检查是否是连续的数字
  const numbers = matches.map(m => parseInt(m[1]));
  const isSequential = numbers.every((num, idx) => idx === 0 || num === numbers[idx - 1] + 1);
  
  if (!isSequential || numbers[0] !== 1) {
    // 不是从1开始的连续列表
    return null;
  }

  // 提取列表前的文本
  const firstMatchIndex = text.indexOf(matches[0][0]);
  const elements: React.ReactNode[] = [];
  
  if (firstMatchIndex > 0) {
    const prefix = text.substring(0, firstMatchIndex).trim();
    if (prefix) {
      elements.push(
        <p key={`prefix-${baseIndex}`} className="leading-relaxed mb-2">
          {parseMarkdown(prefix)}
        </p>
      );
    }
  }

  // 添加列表项
  matches.forEach((match, idx) => {
    const number = match[1];
    let content = match[2].trim();
    // 移除末尾的标点符号和分号
    content = content.replace(/[.。；;，,、]+$/, '').trim();
    
    if (content) {
      elements.push(
        <div key={`list-${baseIndex}-${idx}`} className="flex gap-2 items-start">
          <span className="font-medium text-gray-700 flex-shrink-0 min-w-[1.5rem]">
            {number}.
          </span>
          <span className="flex-1">{parseMarkdown(content)}</span>
        </div>
      );
    }
  });

  return elements.length > 0 ? elements : null;
}

/**
 * 简单的文本格式化，只处理换行
 */
export function formatSimpleText(text: string): string {
  if (!text) return '';
  return text.trim();
}
