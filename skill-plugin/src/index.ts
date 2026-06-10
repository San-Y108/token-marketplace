#!/usr/bin/env node

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import Conf from 'conf';
import axios from 'axios';
type AxiosInstance = any;

// 配置存储
const config = new Conf({
  projectName: 'token-marketplace',
  defaults: {
    server: 'http://localhost:3000',
    username: '',
    apiKey: '',
    autoSync: true,
    syncInterval: 60000
  }
});

// API客户端
let apiClient: AxiosInstance | null = null;

function getApiClient(): AxiosInstance {
  if (!apiClient) {
    const server = config.get('server') as string;
    const apiKey = config.get('apiKey') as string;

    apiClient = axios.create({
      baseURL: server,
      headers: {
        'Authorization': apiKey ? `Bearer ${apiKey}` : '',
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
  }
  return apiClient;
}

// 主程序
const program = new Command();

program
  .name('token-marketplace')
  .description('Token二级市场平台CLI工具')
  .version('1.0.0');

// 绑定命令
program
  .command('bind')
  .description('绑定平台账号')
  .option('-s, --server <url>', '平台服务器地址', 'http://localhost:3000')
  .option('-u, --username <username>', '用户名')
  .option('-p, --password <password>', '密码')
  .action(async (options) => {
    try {
      let server = options.server;
      let username = options.username;
      let password = options.password;

      // 交互式输入
      if (!username || !password) {
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'server',
            message: '平台服务器地址:',
            default: server
          },
          {
            type: 'input',
            name: 'username',
            message: '用户名:',
            default: username
          },
          {
            type: 'password',
            name: 'password',
            message: '密码:',
            mask: '*'
          }
        ]);
        server = answers.server;
        username = answers.username;
        password = answers.password;
      }

      const spinner = ora('正在绑定账号...').start();

      // 登录获取token
      const response = await axios.post(`${server}/api/auth/login`, {
        username,
        password
      });

      if (response.data.success) {
        const { accessToken } = response.data.data.tokens;
        const user = response.data.data.user;

        // 保存配置
        config.set('server', server);
        config.set('username', username);
        config.set('apiKey', accessToken);
        config.set('userId', user.id);
        config.set('role', user.role);

        // 重新初始化API客户端
        apiClient = null;

        spinner.succeed(chalk.green('绑定成功！'));
        console.log(chalk.cyan('\n用户信息:'));
        console.log(`  用户名: ${user.username}`);
        console.log(`  角色: ${user.role}`);
        console.log(`  积分余额: ${user.points_balance}`);
      } else {
        spinner.fail(chalk.red('绑定失败'));
        console.error(chalk.red(response.data.error));
      }
    } catch (error: any) {
      console.error(chalk.red('绑定失败:'), error.message);
    }
  });

// 解绑命令
program
  .command('unbind')
  .description('解绑平台账号')
  .action(async () => {
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: '确定要解绑账号吗？',
        default: false
      }
    ]);

    if (confirm) {
      config.delete('username');
      config.delete('apiKey');
      config.delete('userId');
      config.delete('role');
      apiClient = null;
      console.log(chalk.green('已解绑账号'));
    }
  });

// 上传token命令
program
  .command('upload')
  .description('上传token服务')
  .requiredOption('-n, --name <name>', 'Token名称')
  .requiredOption('-m, --model <model>', '模型名称')
  .requiredOption('-u, --url <url>', 'API基础URL')
  .requiredOption('-k, --key <key>', 'API密钥')
  .option('-p, --protocol <protocol>', '协议类型 (openai|thc|custom)', 'openai')
  .option('--price <price>', '每1000token价格', '0.01')
  .option('-d, --description <description>', '描述')
  .action(async (options) => {
    try {
      const apiKey = config.get('apiKey') as string;
      if (!apiKey) {
        console.log(chalk.red('请先绑定账号: token-marketplace bind'));
        return;
      }

      const spinner = ora('正在上传token...').start();

      const client = getApiClient();
      const response = await client.post('/api/tokens', {
        name: options.name,
        description: options.description || '',
        model_name: options.model,
        base_url: options.url,
        api_key_encrypted: options.key,
        protocol: options.protocol,
        price_per_1k_tokens: parseFloat(options.price)
      });

      if (response.data.success) {
        const token = response.data.data;
        spinner.succeed(chalk.green('上传成功！'));
        console.log(chalk.cyan('\nToken信息:'));
        console.log(`  ID: ${token.id}`);
        console.log(`  名称: ${token.name}`);
        console.log(`  模型: ${token.model_name}`);
        console.log(`  协议: ${token.protocol}`);
        console.log(`  价格: ${token.price_per_1k_tokens} / 1k tokens`);
      } else {
        spinner.fail(chalk.red('上传失败'));
        console.error(chalk.red(response.data.error));
      }
    } catch (error: any) {
      console.error(chalk.red('上传失败:'), error.message);
    }
  });

// 列出token命令
program
  .command('list')
  .description('列出已上传的token')
  .option('-a, --all', '显示所有token（包括停用的）')
  .action(async (options) => {
    try {
      const apiKey = config.get('apiKey') as string;
      if (!apiKey) {
        console.log(chalk.red('请先绑定账号: token-marketplace bind'));
        return;
      }

      const spinner = ora('正在获取token列表...').start();

      const client = getApiClient();
      const response = await client.get('/api/tokens', {
        params: {
          is_active: options.all ? undefined : true
        }
      });

      spinner.stop();

      if (response.data.success) {
        const tokens = response.data.data.tokens;

        if (tokens.length === 0) {
          console.log(chalk.yellow('暂无token'));
          return;
        }

        console.log(chalk.cyan('\nToken列表:'));
        console.log('─'.repeat(80));
        console.log(
          chalk.bold('ID'.padEnd(38)),
          chalk.bold('名称'.padEnd(20)),
          chalk.bold('模型'.padEnd(15)),
          chalk.bold('状态'.padEnd(8)),
          chalk.bold('价格')
        );
        console.log('─'.repeat(80));

        tokens.forEach((token: any) => {
          console.log(
            token.id.padEnd(38),
            token.name.padEnd(20),
            token.model_name.padEnd(15),
            (token.is_active ? '✓ 活跃' : '✗ 停用').padEnd(8),
            `${token.price_per_1k_tokens}/1k`
          );
        });

        console.log('─'.repeat(80));
        console.log(`共 ${tokens.length} 个token`);
      } else {
        console.error(chalk.red('获取失败'));
      }
    } catch (error: any) {
      console.error(chalk.red('获取失败:'), error.message);
    }
  });

// 状态命令
program
  .command('status')
  .description('查看服务状态')
  .action(async () => {
    try {
      const server = config.get('server') as string;
      const username = config.get('username') as string;
      const apiKey = config.get('apiKey') as string;

      console.log(chalk.cyan('\n服务状态:'));
      console.log('─'.repeat(40));
      console.log(`服务器地址: ${server}`);
      console.log(`绑定状态: ${username ? '✓ 已绑定' : '✗ 未绑定'}`);
      console.log(`登录状态: ${apiKey ? '✓ 已登录' : '✗ 未登录'}`);

      if (username) {
        console.log(`用户名: ${username}`);
      }

      // 检查服务器连接
      try {
        const response = await axios.get(`${server}/health`, { timeout: 5000 });
        if (response.data.success) {
          console.log(`服务器状态: ✓ 正常`);
          console.log(`服务版本: ${response.data.version}`);
        } else {
          console.log(`服务器状态: ✗ 异常`);
        }
      } catch (error) {
        console.log(`服务器状态: ✗ 无法连接`);
      }

      console.log('─'.repeat(40));
    } catch (error: any) {
      console.error(chalk.red('获取状态失败:'), error.message);
    }
  });

// 余额命令
program
  .command('balance')
  .description('查看积分余额')
  .action(async () => {
    try {
      const apiKey = config.get('apiKey') as string;
      if (!apiKey) {
        console.log(chalk.red('请先绑定账号: token-marketplace bind'));
        return;
      }

      const client = getApiClient();
      const response = await client.get('/api/marketplace/balance');

      if (response.data.success) {
        const { points_balance } = response.data.data;
        console.log(chalk.cyan('\n积分余额:'));
        console.log(`  ${chalk.bold(points_balance)} 积分`);
      } else {
        console.error(chalk.red('获取余额失败'));
      }
    } catch (error: any) {
      console.error(chalk.red('获取余额失败:'), error.message);
    }
  });

// 历史命令
program
  .command('history')
  .description('查看交易历史')
  .option('-l, --limit <limit>', '显示数量', '10')
  .option('-r, --role <role>', '角色 (consumer|provider)', 'consumer')
  .action(async (options) => {
    try {
      const apiKey = config.get('apiKey') as string;
      if (!apiKey) {
        console.log(chalk.red('请先绑定账号: token-marketplace bind'));
        return;
      }

      const spinner = ora('正在获取交易历史...').start();

      const client = getApiClient();
      const response = await client.get('/api/marketplace/transactions', {
        params: {
          limit: parseInt(options.limit),
          role: options.role
        }
      });

      spinner.stop();

      if (response.data.success) {
        const transactions = response.data.data;

        if (transactions.length === 0) {
          console.log(chalk.yellow('暂无交易记录'));
          return;
        }

        console.log(chalk.cyan('\n交易历史:'));
        console.log('─'.repeat(90));
        console.log(
          chalk.bold('ID'.padEnd(38)),
          chalk.bold('Token'.padEnd(20)),
          chalk.bold('数量'.padEnd(10)),
          chalk.bold('积分'.padEnd(10)),
          chalk.bold('状态'.padEnd(10)),
          chalk.bold('时间')
        );
        console.log('─'.repeat(90));

        transactions.forEach((tx: any) => {
          const date = new Date(tx.created_at).toLocaleString();
          console.log(
            tx.id.padEnd(38),
            (tx.token_name || tx.token_id.substring(0, 18)).padEnd(20),
            tx.tokens_used.toString().padEnd(10),
            tx.points_charged.toFixed(2).padEnd(10),
            tx.status.padEnd(10),
            date
          );
        });

        console.log('─'.repeat(90));
        console.log(`共 ${transactions.length} 条记录`);
      } else {
        console.error(chalk.red('获取失败'));
      }
    } catch (error: any) {
      console.error(chalk.red('获取失败:'), error.message);
    }
  });

// 帮助命令
program
  .command('help [command]')
  .description('显示帮助信息')
  .action((command) => {
    if (command) {
      const cmd = program.commands.find(c => c.name() === command);
      if (cmd) {
        cmd.help();
      } else {
        console.log(chalk.red(`未知命令: ${command}`));
      }
    } else {
      program.help();
    }
  });

// 解析命令行参数
program.parse(process.argv);

// 如果没有参数，显示帮助
if (!process.argv.slice(2).length) {
  program.help();
}
