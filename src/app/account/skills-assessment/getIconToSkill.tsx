import type { IconType } from 'react-icons';
import { AiOutlineJava } from 'react-icons/ai';
import { DiVisualstudio } from 'react-icons/di';
import { SiGithubcopilot } from 'react-icons/si';
import { BiLogoVisualStudio } from 'react-icons/bi';
import { ImCross } from 'react-icons/im';
import { FaAws } from 'react-icons/fa';
import {
    SiAngular,
    SiAnsible,
    SiApachemaven,
    SiApachenetbeanside,
    SiBitbucket,
    SiChartdotjs,
    SiCmake,
    SiConfluence,
    SiCplusplus,
    SiDjango,
    SiDocker,
    SiDotnet,
    SiEclipseide,
    SiEslint,
    SiExpress,
    SiFastapi,
    SiFigma,
    SiGithub,
    SiGitlab,
    SiGo,
    SiGradle,
    SiIntellijidea,
    SiJavascript,
    SiJenkins,
    SiJest,
    SiJetbrains,
    SiJira,
    SiJunit5,
    SiJupyter,
    SiKotlin,
    SiKubernetes,
    SiMiro,
    SiMocha,
    SiMongodb,
    SiMysql,
    SiNextdotjs,
    SiNginx,
    SiNodedotjs,
    SiNumpy,
    SiOpenai,
    SiOpencv,
    SiPandas,
    SiPostgresql,
    SiPrettier,
    SiPycharm,
    SiPython,
    SiQt,
    SiReact,
    SiRedis,
    SiRedux,
    SiRollupdotjs,
    SiRust,
    SiScrumalliance,
    SiSharp,
    SiSpring,
    SiSqlite,
    SiTerraform,
    SiThreedotjs,
    SiTypescript,
    SiVault,
    SiVite,
    SiVuedotjs,
    SiWebpack,
    SiWebstorm,
    SiXcode,
    SiJquery,
} from 'react-icons/si';

import { GoDot } from 'react-icons/go';

export const getIconToSkill: (name: string) => IconType = (name) => {
    if (!name) {
        return GoDot;
    }

    switch (name.toLowerCase()) {
        case 'javascript':
            return SiJavascript;
        case 'jquery':
            return SiJquery;
        case 'typescript':
            return SiTypescript;
        case 'python':
            return SiPython;
        case 'java':
            return AiOutlineJava;
        case 'kotlin':
            return SiKotlin;
        case 'c#':
        case 'csharp':
            return SiSharp;
        case 'c/c++':
        case 'c++':
        case 'cplusplus':
            return SiCplusplus;
        case 'go':
            return SiGo;
        case 'rust':
            return SiRust;
        case 'docker':
            return SiDocker;
        case 'kubernetes':
            return SiKubernetes;
        case 'jira':
            return SiJira;
        case 'confluence':
            return SiConfluence;
        case 'figma':
            return SiFigma;
        case 'miro':
            return SiMiro;
        case 'jenkins':
            return SiJenkins;
        case 'github':
            return SiGithub;
        case 'gitlab':
            return SiGitlab;
        case 'bitbucket':
            return SiBitbucket;
        case 'postgresql':
            return SiPostgresql;
        case 'mongodb':
            return SiMongodb;
        case 'redis':
            return SiRedis;
        case 'mysql':
            return SiMysql;
        case 'scrum':
            return SiScrumalliance;
        case 'kanban':
            return GoDot;
        case 'chatgpt':
            return SiOpenai;
        case 'vscode':
        case 'vs code':
        case 'visual studio code':
            return BiLogoVisualStudio;
        case 'intellij':
        case 'intellij idea':
            return SiIntellijidea;
        case 'react':
            return SiReact;
        case 'vue.js':
        case 'vue':
            return SiVuedotjs;
        case 'angular':
            return SiAngular;
        case 'next.js':
        case 'next':
            return SiNextdotjs;
        case 'express.js':
        case 'express':
            return SiExpress;
        case 'node.js':
            return SiNodedotjs;
        case 'playwright':
            return GoDot;
        case 'jest':
            return SiJest;
        case 'mocha':
            return SiMocha;
        case 'vite':
            return SiVite;
        case 'webpack':
            return SiWebpack;
        case 'rollup':
        case 'rollup.js':
            return SiRollupdotjs;
        case 'eslint':
            return SiEslint;
        case 'prettier':
            return SiPrettier;
        case 'd3.js':
        case 'd3':
            return GoDot;
        case 'chart.js':
        case 'chart':
            return SiChartdotjs;
        case 'three.js':
        case 'three':
            return SiThreedotjs;
        case 'redux':
            return SiRedux;
        case 'django':
            return SiDjango;
        case 'fastapi':
            return SiFastapi;
        case 'pandas':
            return SiPandas;
        case 'numpy':
            return SiNumpy;
        case 'pytest':
            return GoDot;
        case 'jupyter':
            return SiJupyter;
        case 'spring':
            return SiSpring;
        case 'maven':
            return SiApachemaven;
        case 'gradle':
            return SiGradle;
        case 'junit':
        case 'junit5':
            return SiJunit5;
        case '.net':
        case 'dotnet':
            return SiDotnet;
        case 'qt':
            return SiQt;
        case 'opencv':
            return SiOpencv;
        case 'cmake':
            return SiCmake;
        case 'terraform':
            return SiTerraform;
        case 'aws':
        case 'amazonaws':
            return FaAws;
        case 'vault':
            return SiVault;
        case 'nginx':
            return SiNginx;
        case 'ansible':
            return SiAnsible;
        case 'sqlite':
            return SiSqlite;
        case 'pycharm':
            return SiPycharm;
        case 'webstorm':
            return SiWebstorm;
        case 'eclipse':
        case 'eclipseide':
            return SiEclipseide;
        case 'netbeans':
        case 'apache netbeans':
        case 'apachenetbeanside':
            return SiApachenetbeanside;
        case 'clion':
            return SiCmake;
        case 'rider':
            return SiJetbrains;
        case 'visual studio':
            return DiVisualstudio;
        case 'github copilot':
        case 'copilot':
            return SiGithubcopilot;
        case 'xtreme programming':
        case 'extreme programming':
            return ImCross;
        case 'xcode':
            return SiXcode;
        default:
            return GoDot;
    }
};
