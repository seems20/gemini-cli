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

/**
 * 验证项目名称
 */
function validateProjectName(name: string): boolean {
  // 项目名只允许字母、数字、连字符，不能以连字符开头或结尾
  return /^[a-z][a-z0-9-]*[a-z0-9]$|^[a-z]$/.test(name);
}

export const createCommand: SlashCommand = {
  name: 'create',
  description: 'Generate a Java project scaffold using AI. Usage: /create <project-name>',
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

    // 检查项目是否已经存在
    const projectDir = `${projectName}-parent`;
    const fs = require('fs');
    const path = require('path');
    
    try {
      // 检查是否已有POM文件
      const rootPomExists = fs.existsSync(path.join(process.cwd(), projectDir, 'pom.xml'));
      const allPomsExist = rootPomExists && 
        fs.existsSync(path.join(process.cwd(), projectDir, `${projectName}-app`, 'pom.xml')) &&
        fs.existsSync(path.join(process.cwd(), projectDir, `${projectName}-domain`, 'pom.xml')) &&
        fs.existsSync(path.join(process.cwd(), projectDir, `${projectName}-infrastructure`, 'pom.xml')) &&
        fs.existsSync(path.join(process.cwd(), projectDir, `${projectName}-common`, 'pom.xml')) &&
        fs.existsSync(path.join(process.cwd(), projectDir, `${projectName}-start`, 'pom.xml'));

      if (allPomsExist) {
        // 如果POM文件都存在，创建剩余文件
        context.ui.addItem(
          {
            type: MessageType.INFO,
            text: `🔧 检测到POM文件已存在，创建Java文件和配置文件...`,
          },
          Date.now(),
        );
        
        return {
          type: 'submit_prompt',
          content: `为项目"${projectName}"创建剩余的Java文件和配置文件。POM文件已存在，现在创建：

必须创建的3个文件：
☐ 1. ${projectName}-parent/${projectName}-start/src/main/java/com/xiaohongshu/sns/${projectName.replace(/-/g, '')}/start/Application.java (启动类)
☐ 2. ${projectName}-parent/README.md (说明文档)
☐ 3. ${projectName}-parent/.gitignore (忽略文件)

Application.java内容：
package com.xiaohongshu.sns.${projectName.replace(/-/g, '')}.start;

import com.ctrip.framework.apollo.spring.annotation.EnableApolloConfig;
import com.xiaohongshu.infra.rpc.annotation.EnableRedRPC;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.EnableAspectJAutoProxy;

@SpringBootApplication(scanBasePackages = {"com.xiaohongshu.infra", "com.xiaohongshu.sns"})
@EnableApolloConfig
@EnableAspectJAutoProxy
@EnableRedRPC(scanBasePackages = {"com.xiaohongshu.sns"})
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}

README.md内容：
**工程脚手架-示例程序**
---
## 本项目各模块说明：(从下往上、逐层依赖，借鉴alibaba cola结构)
- ${projectName}-common 公共常量、无状态工具集，依赖 sns-common
- ${projectName}-infrastructure 业务无关，对外基础适配层，如数据库、缓存、消息队列、外部rpc-gateway等
- ${projectName}-domain 领域聚合层，ddd模式下面向业务聚合根的封装
- ${projectName}-app 业务逻辑组装层
- ${projectName}-start 应用启动入口、对外服务暴露

.gitignore内容：
HELP.md
target/
!.mvn/wrapper/maven-wrapper.jar
!**/src/main/**/target/
!**/src/test/**/target/

### STS ###
.apt_generated
.classpath
.factorypath
.project
.settings
.springBeans
.sts4-cache

### IntelliJ IDEA ###
.idea
*.iws
*.iml
*.ipr

### NetBeans ###
/nbproject/private/
/nbbuild/
/dist/
/nbdist/
/.nb-gradle/
build/
!**/src/main/**/build/
!**/src/test/**/build/

### VS Code ###
.vscode/

# macOS file
.DS_Store
/.mvn/
/mvnw.cmd
/mvnw

现在创建这3个文件，完成项目创建！`,
        };
      } else {
        // 如果POM文件不存在，创建POM文件
        context.ui.addItem(
          {
            type: MessageType.INFO,
            text: `🚀 生成Java项目脚手架: ${projectName}...`,
          },
          Date.now(),
        );
        
        // 返回提示词，让 AI 生成完整的 Java 项目脚手架
        return {
          type: 'submit_prompt',
          content: `创建Maven项目"${projectName}"的所有POM文件。严格按照以下模板创建6个POM文件，不要添加或修改任何依赖。

必须创建的6个POM文件：
☐ 1. ${projectName}-parent/pom.xml (根POM)
☐ 2. ${projectName}-parent/${projectName}-app/pom.xml (App模块)
☐ 3. ${projectName}-parent/${projectName}-domain/pom.xml (Domain模块)
☐ 4. ${projectName}-parent/${projectName}-infrastructure/pom.xml (Infrastructure模块)
☐ 5. ${projectName}-parent/${projectName}-common/pom.xml (Common模块)
☐ 6. ${projectName}-parent/${projectName}-start/pom.xml (Start模块)

必须创建完所有6个POM文件！严格按照模板，不要添加任何额外依赖！

根POM模板：
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/maven-v4_0_0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>com.xiaohongshu.sns</groupId>
        <artifactId>sns-parent</artifactId>
        <version>1.0.0-SNAPSHOT</version>
    </parent>
    <artifactId>${projectName}-parent</artifactId>
    <version>1.0-SNAPSHOT</version>
    <packaging>pom</packaging>
    <name>${projectName}</name>
    <properties>
        <java.version>11</java.version>
        <root-pom.version>3.3.0-MONTHLY-SNAPSHOT</root-pom.version>
    </properties>
    <modules>
        <module>${projectName}-app</module>
        <module>${projectName}-domain</module>
        <module>${projectName}-infrastructure</module>
        <module>${projectName}-common</module>
        <module>${projectName}-start</module>
    </modules>
    <dependencyManagement>
        <dependencies>
            <dependency>
                <groupId>com.xiaohongshu</groupId>
                <artifactId>infra-root-pom</artifactId>
                <version>\${root-pom.version}</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>
            <!-- Project modules -->
            <dependency>
                <groupId>com.xiaohongshu.sns</groupId>
                <artifactId>${projectName}-start</artifactId>
                <version>\${project.version}</version>
            </dependency>
            <dependency>
                <groupId>com.xiaohongshu.sns</groupId>
                <artifactId>${projectName}-app</artifactId>
                <version>\${project.version}</version>
            </dependency>
            <dependency>
                <groupId>com.xiaohongshu.sns</groupId>
                <artifactId>${projectName}-domain</artifactId>
                <version>\${project.version}</version>
            </dependency>
            <dependency>
                <groupId>com.xiaohongshu.sns</groupId>
                <artifactId>${projectName}-infrastructure</artifactId>
                <version>\${project.version}</version>
            </dependency>
            <dependency>
                <groupId>com.xiaohongshu.sns</groupId>
                <artifactId>${projectName}-common</artifactId>
                <version>\${project.version}</version>
            </dependency>
            <!-- Project modules End -->
            <dependency>
                <groupId>com.xiaohongshu</groupId>
                <artifactId>infra-redconf-client-all</artifactId>
                <version>2.0.0</version>
            </dependency>
            <dependency>
                <groupId>com.ctrip.framework.apollo</groupId>
                <artifactId>red-apollo-client</artifactId>
                <version>1.5.5.11</version>
            </dependency>
            <dependency>
                <groupId>com.xiaohongshu</groupId>
                <artifactId>apollo-client-helper</artifactId>
                <version>1.0.6</version>
            </dependency>
        </dependencies>
    </dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>com.xiaohongshu</groupId>
            <artifactId>infra-framework-rpc-core</artifactId>
        </dependency>
        <dependency>
            <groupId>com.xiaohongshu</groupId>
            <artifactId>infra-framework-rpc-spring</artifactId>
        </dependency>
        <dependency>
            <groupId>com.dianping.cat</groupId>
            <artifactId>cat-client</artifactId>
        </dependency>
        <dependency>
            <groupId>com.xiaohongshu.xray</groupId>
            <artifactId>xray-logging</artifactId>
        </dependency>
    </dependencies>
    <build>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <version>3.8.1</version>
                <configuration>
                    <source>\${java.version}</source>
                    <target>\${java.version}</target>
                    <encoding>UTF-8</encoding>
                </configuration>
            </plugin>
        </plugins>
    </build>
    <distributionManagement>
        <snapshotRepository>
            <id>snapshots</id>
            <name>nexus snapshot repository</name>
            <url>https://artifactory.devops.xiaohongshu.com/artifactory/maven-snapshots/</url>
        </snapshotRepository>
        <repository>
            <id>releases</id>
            <name>nexus repository</name>
            <url>https://artifactory.devops.xiaohongshu.com/artifactory/maven-releases/</url>
        </repository>
    </distributionManagement>
</project>

App模块POM模板：
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/maven-v4_0_0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>com.xiaohongshu.sns</groupId>
        <artifactId>${projectName}-parent</artifactId>
        <version>1.0-SNAPSHOT</version>
        <relativePath>../pom.xml</relativePath>
    </parent>
    <artifactId>${projectName}-app</artifactId>
    <packaging>jar</packaging>
    <name>${projectName}-app</name>
    <dependencies>
        <dependency>
            <groupId>com.xiaohongshu.sns</groupId>
            <artifactId>${projectName}-domain</artifactId>
        </dependency>
        <dependency>
            <groupId>com.xiaohongshu.sns</groupId>
            <artifactId>${projectName}-infrastructure</artifactId>
        </dependency>
    </dependencies>
</project>

Domain模块POM模板：
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/maven-v4_0_0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>com.xiaohongshu.sns</groupId>
        <artifactId>${projectName}-parent</artifactId>
        <version>1.0-SNAPSHOT</version>
        <relativePath>../pom.xml</relativePath>
    </parent>
    <artifactId>${projectName}-domain</artifactId>
    <packaging>jar</packaging>
    <name>${projectName}-domain</name>
    <dependencies>
        <dependency>
            <groupId>com.xiaohongshu.sns</groupId>
            <artifactId>${projectName}-common</artifactId>
        </dependency>
    </dependencies>
</project>

Infrastructure模块POM模板：
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/maven-v4_0_0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>com.xiaohongshu.sns</groupId>
        <artifactId>${projectName}-parent</artifactId>
        <version>1.0-SNAPSHOT</version>
        <relativePath>../pom.xml</relativePath>
    </parent>
    <artifactId>${projectName}-infrastructure</artifactId>
    <packaging>jar</packaging>
    <name>${projectName}-infrastructure</name>
    <dependencies>
        <!-- moudle自依赖 -->
        <dependency>
            <groupId>com.xiaohongshu.sns</groupId>
            <artifactId>${projectName}-common</artifactId>
        </dependency>
        <dependency>
            <groupId>com.xiaohongshu.sns</groupId>
            <artifactId>${projectName}-domain</artifactId>
        </dependency>

        <!-- spring依赖 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-configuration-processor</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework</groupId>
            <artifactId>spring-context-support</artifactId>
        </dependency>

        <!-- 中间件依赖 -->
        <dependency>
            <groupId>com.xiaohongshu</groupId>
            <artifactId>gateway-starter</artifactId>
        </dependency>
        <dependency>
            <groupId>com.xiaohongshu</groupId>
            <artifactId>infra-framework-rpc-core</artifactId>
        </dependency>
        <dependency>
            <groupId>com.xiaohongshu</groupId>
            <artifactId>events-client</artifactId>
        </dependency>
    </dependencies>
</project>

Common模块POM模板：
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/maven-v4_0_0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>com.xiaohongshu.sns</groupId>
        <artifactId>${projectName}-parent</artifactId>
        <version>1.0-SNAPSHOT</version>
        <relativePath>../pom.xml</relativePath>
    </parent>
    <artifactId>${projectName}-common</artifactId>
    <packaging>jar</packaging>
    <name>${projectName}-common</name>
    <dependencies>
        <!-- 基础依赖 -->
        <dependency>
            <groupId>com.xiaohongshu.xray</groupId>
            <artifactId>xray-logging</artifactId>
        </dependency>
        <dependency>
            <groupId>com.dianping.cat</groupId>
            <artifactId>cat-client</artifactId>
        </dependency>
        <dependency>
            <groupId>com.ctrip.framework.apollo</groupId>
            <artifactId>red-apollo-client</artifactId>
        </dependency>
        <dependency>
            <groupId>com.xiaohongshu</groupId>
            <artifactId>apollo-client-helper</artifactId>
        </dependency>
    </dependencies>
</project>

Start模块POM模板：
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/maven-v4_0_0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>com.xiaohongshu.sns</groupId>
        <artifactId>${projectName}-parent</artifactId>
        <version>1.0-SNAPSHOT</version>
        <relativePath>../pom.xml</relativePath>
    </parent>
    <artifactId>${projectName}-start</artifactId>
    <name>${projectName}</name>
    <dependencies>
        <!-- 测试依赖 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <exclusions>
                <exclusion>
                    <groupId>org.apache.logging.log4j</groupId>
                    <artifactId>log4j-to-slf4j</artifactId>
                </exclusion>
            </exclusions>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-test</artifactId>
            <scope>test</scope>
        </dependency>

        <dependency>
            <groupId>com.xiaohongshu.sns</groupId>
            <artifactId>sns-web-starter</artifactId>
            <version>1.0.0-SNAPSHOT</version>
        </dependency>

        <dependency>
            <groupId>com.xiaohongshu.myhub</groupId>
            <artifactId>myhub-springboot-starter</artifactId>
            <version>3.5.28-RELEASE</version>
        </dependency>

        <dependency>
            <groupId>org.mybatis</groupId>
            <artifactId>mybatis</artifactId>
        </dependency>

        <dependency>
            <groupId>org.mybatis</groupId>
            <artifactId>mybatis-spring</artifactId>
            <version>2.1.2</version>
        </dependency>
        <!-- moudle自依赖 -->
        <dependency>
            <groupId>com.xiaohongshu.sns</groupId>
            <artifactId>${projectName}-app</artifactId>
        </dependency>
    </dependencies>

    <build>
        <finalName>${projectName}</finalName>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>

重要规则：
1. 严格按照上述模板创建，不要添加任何额外依赖
2. 不要自主生成依赖内容
3. 只替换${projectName}变量
4. 保持所有注释和格式

现在专注创建这6个POM文件，每个都要完整正确！

创建完6个POM文件后，询问用户："✅ POM文件创建完成！是否继续创建Java启动类、README和gitignore文件？(y/n)"

如果用户回答"y"或"yes"，则继续创建以下3个文件。注意：Java文件必须语法完整，包含所有必需的大括号！

重要提醒：Application.java必须是完整的Java类，包含开始大括号和结束大括号！

Application.java完整内容（从package到最后的结束大括号}）：
package com.xiaohongshu.sns.${projectName.replace(/-/g, '')}.start;

import com.ctrip.framework.apollo.spring.annotation.EnableApolloConfig;
import com.xiaohongshu.infra.rpc.annotation.EnableRedRPC;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.EnableAspectJAutoProxy;

@SpringBootApplication(scanBasePackages = {"com.xiaohongshu.infra", "com.xiaohongshu.sns"})
@EnableApolloConfig
@EnableAspectJAutoProxy
@EnableRedRPC(scanBasePackages = {"com.xiaohongshu.sns"})
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}

关键要求：Application.java文件必须以}结尾，这是类的结束大括号，不能省略！

README.md内容模板：
**工程脚手架-示例程序**
---
## 本项目各模块说明：(从下往上、逐层依赖，借鉴alibaba cola结构)
- ${projectName}-common 公共常量、无状态工具集，依赖 sns-common
- ${projectName}-infrastructure 业务无关，对外基础适配层，如数据库、缓存、消息队列、外部rpc-gateway等
- ${projectName}-domain 领域聚合层，ddd模式下面向业务聚合根的封装
- ${projectName}-app 业务逻辑组装层
- ${projectName}-start 应用启动入口、对外服务暴露

.gitignore内容模板：
HELP.md
target/
!.mvn/wrapper/maven-wrapper.jar
!**/src/main/**/target/
!**/src/test/**/target/

### STS ###
.apt_generated
.classpath
.factorypath
.project
.settings
.springBeans
.sts4-cache

### IntelliJ IDEA ###
.idea
*.iws
*.iml
*.ipr

### NetBeans ###
/nbproject/private/
/nbbuild/
/dist/
/nbdist/
/.nb-gradle/
build/
!**/src/main/**/build/
!**/src/test/**/build/

### VS Code ###
.vscode/

# macOS file
.DS_Store
/.mvn/
/mvnw.cmd
/mvnw

如果用户回答"n"或"no"，则回复"项目POM结构创建完成！"并停止。`,
        };
      }
    } catch (error) {
      context.ui.addItem(
        {
          type: MessageType.ERROR,
          text: `❌ 检查项目状态时出错: ${error}`,
        },
        Date.now(),
      );
      return;
    }
  },
}; 