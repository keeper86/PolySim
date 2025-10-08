import type { IconType } from 'react-icons';
import { AiOutlineJava } from 'react-icons/ai';
import { BiLogoVisualStudio } from 'react-icons/bi';
import { DiVisualstudio } from 'react-icons/di';
import { FaAws, FaGit } from 'react-icons/fa';
import { ImCross } from 'react-icons/im';
import {
    SiAndroidstudio,
    SiAngular,
    SiAnsible,
    SiApachecassandra,
    SiApachemaven,
    SiApachenetbeanside,
    SiAstro,
    SiBitbucket,
    SiChartdotjs,
    SiCmake,
    SiConfluence,
    SiCplusplus,
    SiD3Dotjs,
    SiDjango,
    SiDocker,
    SiDotnet,
    SiEclipseide,
    SiElasticsearch,
    SiEslint,
    SiExpress,
    SiFastapi,
    SiFigma,
    SiFlask,
    SiGithub,
    SiGithubcopilot,
    SiGitlab,
    SiGo,
    SiGooglecloud,
    SiGradle,
    SiHelm,
    SiHibernate,
    SiInkscape,
    SiIntellijidea,
    SiJavascript,
    SiJenkins,
    SiJest,
    SiJetbrains,
    SiJira,
    SiJquery,
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
    SiNotion,
    SiNumpy,
    SiNuxtdotjs,
    SiOpenai,
    SiOpencv,
    SiPandas,
    SiPostgresql,
    SiPrettier,
    SiPycharm,
    SiPython,
    SiPytorch,
    SiQt,
    SiReact,
    SiRedis,
    SiRedux,
    SiRollupdotjs,
    SiRust,
    SiScikitlearn,
    SiScrumalliance,
    SiSharp,
    SiSlack,
    SiSpring,
    SiSpringboot,
    SiSqlite,
    SiSubversion,
    SiTensorflow,
    SiTerraform,
    SiThreedotjs,
    SiTypescript,
    SiUnity,
    SiVault,
    SiVite,
    SiVuedotjs,
    SiWebpack,
    SiWebstorm,
    SiXcode,
} from 'react-icons/si';
import { TbBrandAzure } from 'react-icons/tb';

import { FaPython } from 'react-icons/fa';
import { GiSwan } from 'react-icons/gi';
import SvgGnuplotIcon from '@/components/icons/GnuplotIcon';

export const GnuplotGreyIcon: IconType = (props) => (
    <span style={{ filter: 'grayscale(1) contrast(130%)' }}>
        <SvgGnuplotIcon {...props} />
    </span>
);

export const getIconToSkill: (name: string) => IconType | undefined = (name) => {
    if (!name) {
        return undefined;
    }

    switch (name.toLowerCase()) {
        case 'gnuplot':
            return GnuplotGreyIcon;
        case 'git':
            return FaGit;
        case 'azure':
            return TbBrandAzure;
        case 'inkscape':
            return SiInkscape;
        case 'cassandra':
            return SiApachecassandra;
        case 'javascript':
            return SiJavascript;
        case 'nuxt.js':
        case 'nuxt':
            return SiNuxtdotjs;
        case 'astro':
            return SiAstro;
        case 'd3.js':
        case 'd3':
            return SiD3Dotjs;
        case 'tensorflow':
            return SiTensorflow;
        case 'pytest':
            return FaPython;
        case 'unity':
            return SiUnity;
        case 'swing':
            return GiSwan;
        case 'svn':
        case 'subversion':
            return SiSubversion;
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
        case 'flask':
            return SiFlask;
        case 'pytorch':
            return SiPytorch;
        case 'scikit-learn':
        case 'sklearn':
            return SiScikitlearn;
        case 'spring boot':
        case 'springboot':
            return SiSpringboot;
        case 'hibernate':
            return SiHibernate;
        case 'google cloud':
        case 'gcp':
            return SiGooglecloud;
        case 'helm':
            return SiHelm;
        case 'slack':
            return SiSlack;
        case 'notion':
            return SiNotion;
        case 'elasticsearch':
            return SiElasticsearch;
        case 'android studio':
            return SiAndroidstudio;
        default:
            return undefined;
    }
};
