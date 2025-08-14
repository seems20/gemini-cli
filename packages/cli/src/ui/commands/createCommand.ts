/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  type CommandContext,
  type SlashCommand,
  CommandKind,
  type SlashCommandActionReturn,
} from './types.js';
import { MessageType } from '../types.js';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 验证项目名称
 */
function validateProjectName(name: string): boolean {
  // 项目名只允许字母、数字、连字符，不能以连字符开头或结尾
  return /^[a-z][a-z0-9-]*[a-z0-9]$|^[a-z]$/.test(name);
}

/**
 * 获取脚手架模板路径
 */
function getTemplatePath(): string {
  // 尝试多个可能的模板位置
  const possiblePaths = [
    // 1. 开发环境：相对于工作区根目录的sns-demo
    path.join(process.cwd(), 'sns-demo'),
    
    // 2. 开发环境：相对于包根目录的sns-demo  
    path.join(__dirname, '..', '..', '..', '..', 'sns-demo'),
    
    // 3. 打包后：bundle目录中的template
    path.join(__dirname, 'template'),
    path.join(__dirname, '..', 'template'),
    path.join(__dirname, '..', '..', 'template'),
    
    // 4. 全局安装：相对于可执行文件的template
    path.join(path.dirname(process.argv[0]), 'template'),
    path.join(path.dirname(process.argv[0]), '..', 'template'),
    path.join(path.dirname(process.argv[0]), '..', 'lib', 'template'),
  ];
  
  for (const templatePath of possiblePaths) {
    if (fs.existsSync(templatePath)) {
      return templatePath;
    }
  }
  
  // 如果都找不到，返回默认路径（会在后续检查中报错）
  return path.join(process.cwd(), 'sns-demo');
}

/**
 * 替换项目名称相关的内容
 */
function replaceProjectNames(content: string, oldName: string, newName: string): string {
  const cleanNewName = newName.replace(/-/g, '');
  return content
    // 先处理包含 sns-demo 的特定模式
    .replace(/com\.xiaohongshu\.sns\.demo/g, `com.xiaohongshu.sns.${cleanNewName}`)
    .replace(/<artifactId>sns-demo-parent<\/artifactId>/g, `<artifactId>${newName}-parent</artifactId>`)
    .replace(/<artifactId>sns-demo-([^<]+)<\/artifactId>/g, `<artifactId>${newName}-$1</artifactId>`)
    .replace(/<artifactId>sns-demo<\/artifactId>/g, `<artifactId>${newName}</artifactId>`)
    .replace(/<name>sns-demo<\/name>/g, `<name>${newName}</name>`)
    .replace(/<name>sns-demo-([^<]+)<\/name>/g, `<name>${newName}-$1</name>`)
    .replace(/<module>sns-demo-([^<]+)<\/module>/g, `<module>${newName}-$1</module>`)
    .replace(/<artifactId>\${projectName}-([^<]+)<\/artifactId>/g, `<artifactId>${newName}-$1</artifactId>`)
    .replace(/spring\.application\.name=sns-demo/g, `spring.application.name=${newName}`)
    .replace(/spring\.application\.name:\s*sns-demo/g, `spring.application.name: ${newName}`)
    // 最后处理一般的 sns-demo 替换
    .replace(/sns-demo/g, newName);
}

/**
 * 复制单个文件并替换内容
 */
async function copyAndReplaceFile(srcFile: string, destFile: string, oldName: string, newName: string): Promise<void> {
  // 确保目标目录存在
  const destDir = path.dirname(destFile);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  
  // 读取源文件内容
  const content = fs.readFileSync(srcFile, 'utf8');
  
  // 替换内容
  const newContent = replaceProjectNames(content, oldName, newName);
  
  // 写入目标文件
  fs.writeFileSync(destFile, newContent, 'utf8');
}

/**
 * 递归复制目录并替换名称
 */
async function copyAndReplaceDir(srcDir: string, destDir: string, oldName: string, newName: string): Promise<void> {
  // 确保目标目录存在
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  
  // 读取源目录内容
  const items = fs.readdirSync(srcDir);
  
  for (const item of items) {
    const srcPath = path.join(srcDir, item);
    // 使用与文件内容替换相同的逻辑：将 sns-demo 替换为新项目名
    const destItemName = item.replace(/sns-demo/g, newName);
    const destPath = path.join(destDir, destItemName);
    
    const stats = fs.statSync(srcPath);
    
    if (stats.isDirectory()) {
      // 递归复制目录
      await copyAndReplaceDir(srcPath, destPath, oldName, newName);
    } else if (stats.isFile()) {
      // 复制并替换文件内容
      await copyAndReplaceFile(srcPath, destPath, oldName, newName);
    }
  }
}

export const createCommand: SlashCommand = {
  name: 'create',
  description: 'Generate a Java project scaffold from template. Usage: /create <project-name>',
  kind: CommandKind.BUILT_IN,
  action: async (
    context: CommandContext,
    args: string,
  ): Promise<SlashCommandActionReturn | void> => {
    const projectName = args.trim();
    
    if (!validateProjectName(projectName)) {
      context.ui.addItem(
        {
          type: MessageType.ERROR,
          text: '❌ 项目名称无效。请使用字母、数字和连字符，不能以连字符开头或结尾。',
        },
        Date.now(),
      );
      return;
    }

    // 获取模板路径
    const templatePath = getTemplatePath();
    
    // 检查模板是否存在
    if (!fs.existsSync(templatePath)) {
      context.ui.addItem(
        {
          type: MessageType.ERROR,
          text: `❌ 脚手架模板不存在：${templatePath}\n请确保工作区根目录包含 sns-demo 文件夹。`,
        },
        Date.now(),
      );
      return;
    }

    // 检查目标项目是否已经存在
    const targetPath = path.join(process.cwd(), projectName);
    if (fs.existsSync(targetPath)) {
      context.ui.addItem(
        {
          type: MessageType.ERROR,
          text: `❌ 项目目录已存在：${targetPath}`,
        },
        Date.now(),
      );
      return;
    }

    try {
      context.ui.addItem(
        {
          type: MessageType.INFO,
          text: `🚀 开始创建项目 ${projectName}...`,
        },
        Date.now(),
      );

      // 复制模板并替换名称
      await copyAndReplaceDir(templatePath, targetPath, 'demo', projectName);

      context.ui.addItem(
        {
          type: MessageType.INFO,
          text: `✅ 项目 ${projectName} 创建成功！\n📁 位置：${targetPath}\n\n项目结构：\n${projectName}/\n├── ${projectName}-app/\n├── ${projectName}-domain/\n├── ${projectName}-infrastructure/\n├── ${projectName}-common/\n├── ${projectName}-start/\n├── pom.xml\n├── README.md\n└── .gitignore`,
        },
        Date.now(),
      );
    } catch (error) {
      // 清理失败的创建
      if (fs.existsSync(targetPath)) {
        try {
          fs.rmSync(targetPath, { recursive: true, force: true });
        } catch (cleanupError) {
          console.warn('Warning: Could not clean up failed project creation:', cleanupError);
        }
      }
      
      context.ui.addItem(
        {
          type: MessageType.ERROR,
          text: `❌ 创建项目失败：${error instanceof Error ? error.message : String(error)}`,
        },
        Date.now(),
      );
    }
  },
}; 