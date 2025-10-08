import type { IconType } from 'react-icons';
import { AiOutlineJava } from 'react-icons/ai';
import { BiLogoVisualStudio } from 'react-icons/bi';
import { DiVisualstudio } from 'react-icons/di';
import { FaAws, FaGit, FaPhp, FaHtml5 } from 'react-icons/fa';
import { ImCross } from 'react-icons/im';
import {
    SiAndroid,
    SiAndroidstudio,
    SiAngular,
    SiAnsible,
    SiApachecassandra,
    SiApachemaven,
    SiApachenetbeanside,
    SiAstro,
    SiBitbucket,
    SiBoost,
    SiBootstrap,
    SiBulma,
    SiBun,
    SiChartdotjs,
    SiCircleci,
    SiClojure,
    SiCmake,
    SiCockroachlabs,
    SiCodeigniter,
    SiComposer,
    SiConan,
    SiConfluence,
    SiCplusplus,
    SiCypress,
    SiD3Dotjs,
    SiDatadog,
    SiDeno,
    SiDjango,
    SiDocker,
    SiDotnet,
    SiDrupal,
    SiEclipseide,
    SiElasticsearch,
    SiElixir,
    SiErlang,
    SiEsbuild,
    SiEslint,
    SiExpress,
    SiFastapi,
    SiFigma,
    SiFirebase,
    SiFlask,
    SiGithub,
    SiGithubactions,
    SiGithubcopilot,
    SiGitlab,
    SiGnuemacs,
    SiGo,
    SiGooglecloud,
    SiGradle,
    SiGrafana,
    SiHaskell,
    SiHelm,
    SiHibernate,
    SiHuggingface,
    SiInfluxdb,
    SiInkscape,
    SiIntellijidea,
    SiJavascript,
    SiJenkins,
    SiJest,
    SiJetbrains,
    SiJira,
    SiJoomla,
    SiJquery,
    SiJulia,
    SiJunit5,
    SiJupyter,
    SiKotlin,
    SiKtor,
    SiKubernetes,
    SiLaravel,
    SiLess,
    SiLua,
    SiMiro,
    SiMobx,
    SiMocha,
    SiMongodb,
    SiMysql,
    SiNeo4J,
    SiNewrelic,
    SiNextdotjs,
    SiNginx,
    SiNodedotjs,
    SiNotion,
    SiNpm,
    SiNumpy,
    SiNuxtdotjs,
    SiOpenai,
    SiOpencv,
    SiOpentelemetry,
    SiPandas,
    SiPerl,
    SiPnpm,
    SiPostgresql,
    SiPrettier,
    SiPrometheus,
    SiPycharm,
    SiPython,
    SiPytorch,
    SiQt,
    SiR,
    SiReact,
    SiRedis,
    SiRedux,
    SiRemix,
    SiRollupdotjs,
    SiRuby,
    SiRubyonrails,
    SiRust,
    SiSass,
    SiScala,
    SiScikitlearn,
    SiScrumalliance,
    SiSharp,
    SiSlack,
    SiSpring,
    SiSpringboot,
    SiSqlite,
    SiSublimetext,
    SiSubversion,
    SiSvelte,
    SiSwc,
    SiSwift,
    SiSymfony,
    SiTailwindcss,
    SiTensorflow,
    SiTerraform,
    SiThreedotjs,
    SiTypescript,
    SiUnity,
    SiVault,
    SiVim,
    SiVite,
    SiVitest,
    SiVuedotjs,
    SiWebassembly,
    SiWebpack,
    SiWebstorm,
    SiWordpress,
    SiXcode,
    SiYarn,
    SiFortran,
    SiDelphi,
} from 'react-icons/si';
import { TbTerminal2 } from 'react-icons/tb';
import { FaBrain } from 'react-icons/fa6';

import { TbBrandAzure } from 'react-icons/tb';
import { TiArrowLoop } from 'react-icons/ti';
import { TbMathIntegral } from 'react-icons/tb';
import { SiAmazondynamodb } from 'react-icons/si';
import { FaInfinity } from 'react-icons/fa6';

import SvgGnuplotIcon from '@/components/icons/GnuplotIcon';
import { FaPython } from 'react-icons/fa';
import { GiSwan } from 'react-icons/gi';

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
        case 'ci/cd':
            return FaInfinity;
        case 'dynamodb':
            return SiAmazondynamodb;
        case 'ides':
            return TbMathIntegral;
        case 'agile methodologies':
            return TiArrowLoop;
        case 'ai tools':
            return FaBrain;
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
        case 'gitlab ci':
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
        case 'aws':
        case 'amazonaws':
            return FaAws;
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
        case 'hashicorp vault':
            return SiVault;
        case 'nginx':
            return SiNginx;
        case 'shell scripting':
        case 'shell':
        case 'bash':
        case 'zsh':
        case 'sh':
            return TbTerminal2;
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
        case 'rider':
            return SiJetbrains;
        case 'webassembly':
            return SiWebassembly;
        case 'deno':
            return SiDeno;
        case 'bun':
            return SiBun;
        case 'remix':
            return SiRemix;
        case 'svelte':
            return SiSvelte;
        case 'cypress':
            return SiCypress;
        case 'vitest':
            return SiVitest;
        case 'esbuild':
            return SiEsbuild;
        case 'swc':
            return SiSwc;
        case 'mobx':
            return SiMobx;
        case 'pnpm':
            return SiPnpm;
        case 'yarn':
            return SiYarn;
        case 'npm':
            return SiNpm;
        case 'ktor':
            return SiKtor;
        case 'android':
        case 'android development':
            return SiAndroid;
        case 'boost':
            return SiBoost;
        case 'conan':
            return SiConan;
        case 'ruby':
            return SiRuby;
        case 'ruby on rails':
            return SiRubyonrails;
        case 'laravel':
            return SiLaravel;
        case 'symfony':
            return SiSymfony;
        case 'codeigniter':
            return SiCodeigniter;
        case 'wordpress':
            return SiWordpress;
        case 'drupal':
            return SiDrupal;
        case 'joomla':
            return SiJoomla;
        case 'composer':
            return SiComposer;
        case 'sass':
            return SiSass;
        case 'less':
            return SiLess;
        case 'tailwind css':
        case 'tailwindcss':
            return SiTailwindcss;
        case 'bootstrap':
            return SiBootstrap;
        case 'bulma':
            return SiBulma;
        case 'swift':
            return SiSwift;
        case 'r':
            return SiR;
        case 'perl':
            return SiPerl;
        case 'lua':
            return SiLua;
        case 'haskell':
            return SiHaskell;
        case 'scala':
            return SiScala;
        case 'elixir':
            return SiElixir;
        case 'clojure':
            return SiClojure;
        case 'erlang':
            return SiErlang;
        case 'julia':
            return SiJulia;
        case 'github actions':
            return SiGithubactions;
        case 'circleci':
            return SiCircleci;
        case 'prometheus':
            return SiPrometheus;
        case 'grafana':
            return SiGrafana;
        case 'opentelemetry':
            return SiOpentelemetry;
        case 'datadog':
            return SiDatadog;
        case 'new relic':
        case 'newrelic':
            return SiNewrelic;
        case 'hugging face':
        case 'huggingface':
            return SiHuggingface;
        case 'sublime text':
        case 'sublimetext':
            return SiSublimetext;
        case 'vim':
            return SiVim;
        case 'emacs':
        case 'gnu emacs':
            return SiGnuemacs;
        case 'firebase':
            return SiFirebase;
        case 'neo4j':
            return SiNeo4J;
        case 'influxdb':
            return SiInfluxdb;
        case 'cockroachdb':
            return SiCockroachlabs;
        case 'fortran':
            return SiFortran;
        case 'pascal':
        case 'delphi':
        case 'object pascal':
        case 'pascal/delphi':
            return SiDelphi;
        case 'html/css':
        case 'html5':
            return FaHtml5;
        case 'php':
            return FaPhp;
        default:
            return undefined;
    }
};
