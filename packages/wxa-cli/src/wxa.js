import commander from 'commander';
import inquirer from 'inquirer';
import path from 'path';
import Builder from './builder';
import Tester from './tester/index';
import https from 'https';
import {spawnBuilder} from './builder';
import chalk from 'chalk';
import Creator from './creator';
import convert from './convert';
import {spawnDevToolCli} from './toolcli';
import {getConfigs} from './getConfigs';
import {WXA_PROJECT_NAME} from './const/wxaConfigs';
import {isEmpty} from './utils';
import logger from './helpers/logger';

import ExposeInterface from './exposeInterface';

const version = require('../package.json').version;

let showSlogan = () => {
    console.info(`🖖 Hi, @wxa version ${chalk.keyword('orange')(''+version)} present`);
};

let processProjectsOptions = (configs, cmdOptions) => {
    let projects = cmdOptions.project;

    if (isEmpty(projects)) {
        projects = configs[0].name !== WXA_PROJECT_NAME ? configs[0].name : WXA_PROJECT_NAME;
    }

    if (projects === '*') projects = configs.reduce((p, i) => (p+','+i.name), '');

    projects = projects.split(',');
    projects = projects.filter((p)=>!isEmpty(p));

    cmdOptions.project = projects;

    return;
};

commander
.version(version, '-v, --version')
.usage('[command] <options ...>');

commander
.command('build')
.description('编译项目')
.option('--configs-path <configsPath>', 'wxa.configs.js文件路径，默认项目根目录')
.option('-w, --watch', '监听文件改动')
.option('-N, --no-cache', '不使用缓存')
.option('--source-map', '生成sourceMap并输出')
.option('-p, --project <project>', '指定需要编译的项目，默认是default， * 表示编译所有项目')
.option('--no-progress', '不展示文件进度')
.option('--verbose', '展示多余的信息')
.option('-t, --target', '编译目标平台，如微信小程序wechat, 头条小程序tt')
.option('--mock', '是否编译wxa:mock指令')
.action(async (cmd)=>{
    showSlogan();
    console.info(`🤖 Building with ${chalk.keyword('orange')(process.env.NODE_ENV || 'development')} env` );
    let configs = getConfigs(cmd.configsPath);
    processProjectsOptions(configs, cmd);

    spawnBuilder(configs, cmd);
});

commander
.command('create')
.description('新建模板')
.option('--repo <repo>', '仓库地址，可选github或gitee，允许传自定义的repo地址，网速考虑，默认gitee', 'gitee')
.action(async (cmd)=>{
    showSlogan();
    console.info('🦊 Creating 新建项目中');

    new Creator(cmd).run();
});

commander
.command('cli')
.description('微信开发者工具命令行调用')
.option('--configs-path <configsPath>', 'wxa.configs.js文件路径，默认项目根目录')
.option('-a, --action <action>', '指定操作, open, login, preview, upload')
.option('-p, --project <project>', '三方开发模式，单独指定操作的项目')
.option('--project-name <projectName>', '项目名')
.action(async (cmd)=>{
    showSlogan();
    console.info('🐌 目前仅支持调用微信开发者工具指令');
    let configs = getConfigs(cmd.configsPath);
    processProjectsOptions(configs, cmd);

    spawnDevToolCli(configs, cmd);
});

commander
.command('test')
.description('测试模式')
.option('-e, --e2e', 'e2e测试模式')
.option('-p, --port', '监听端口')
.option('-o, --out-dir [outDir]', '测试用例输出文件夹', '__wxa_e2e_test__')
.option('--cli-path [cliPath]', '微信开发者工具路径')
.option('-r, --record', 'e2e测试录制模式，启动小程序自动开始录制')
.option('-t, --test [testName]', 'e2e执行测试用例，缺省则执行所有用例，多个用例名用逗号区分')
.option('--base', '仅截屏，作为后续回放用例比较基准')
.option('--screenshot-diff [screenshotDiff]', '是否进行截屏比对')
.option('--custom-expect', '进行自定义期望匹配，record.js里每一步的customExpect函数编写期望代码')
.option('--py-diff [pyDiff]', '是否使用python进行相似度比对')
.option('--no-mock', '不mock接口')
.option('--verbose', '展示多余的信息')
.option('--no-progress', '不展示文件进度')
.option('--project-name <projectName>', '项目名')
.action((cmd)=>{
    showSlogan();
    let wxaConfigs = getConfigs();
    processProjectsOptions(wxaConfigs, cmd);
    
    let [target] = cmd.project;
    let projectConfigs = wxaConfigs.find((item)=> item.name === target);
    
    console.info(`➰ Tester Mode. Building with ${chalk.keyword('orange')(process.env.NODE_ENV || 'development')} env. ${target.toUpperCase()}` );
    new Tester(cmd, projectConfigs).build();
});

commander
    .command('convert')
    .description('原生小程序代码转 wxa')
    .option('-i, --input <input>', '原生小程序代码路径')
    .option('-o, --output <output>', '输出路径')
    .action(async (cmd)=>{
        showSlogan();
        console.info('🦊 Converting 转换中');

        convert(cmd);
    });

commander.parse(process.argv);

module.exports = {
    ExposeInterface,
};

