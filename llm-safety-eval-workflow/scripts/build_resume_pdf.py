from __future__ import annotations

from pathlib import Path
import re

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "resume" / "bytedance_ai_data_resume.pdf"


def register_font() -> tuple[str, str]:
    candidates = [
        Path(r"C:\Windows\Fonts\msyh.ttc"),
        Path(r"C:\Windows\Fonts\simsun.ttc"),
        Path(r"C:\Windows\Fonts\simhei.ttf"),
    ]
    bold_candidates = [
        Path(r"C:\Windows\Fonts\msyhbd.ttc"),
        Path(r"C:\Windows\Fonts\simhei.ttf"),
    ]
    regular = next((path for path in candidates if path.exists()), None)
    bold = next((path for path in bold_candidates if path.exists()), regular)
    if not regular:
        return "Helvetica", "Helvetica-Bold"
    pdfmetrics.registerFont(TTFont("ResumeCN", str(regular)))
    pdfmetrics.registerFont(TTFont("ResumeCN-Bold", str(bold)))
    return "ResumeCN", "ResumeCN-Bold"


FONT, FONT_BOLD = register_font()


def esc(text: str) -> str:
    return (
        text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace(" -> ", " → ")
    )


def p(text: str, style: ParagraphStyle) -> Paragraph:
    return Paragraph(esc(text), style)


def bullet(text: str, style: ParagraphStyle) -> Paragraph:
    return Paragraph("• " + esc(text), style)


styles = getSampleStyleSheet()
name_style = ParagraphStyle(
    "Name",
    parent=styles["Normal"],
    fontName=FONT_BOLD,
    fontSize=20,
    leading=24,
    alignment=1,
    textColor=colors.HexColor("#111827"),
)
contact_style = ParagraphStyle(
    "Contact",
    parent=styles["Normal"],
    fontName=FONT,
    fontSize=8.5,
    leading=11,
    alignment=1,
    textColor=colors.HexColor("#374151"),
)
summary_style = ParagraphStyle(
    "Summary",
    parent=styles["Normal"],
    fontName=FONT,
    fontSize=8.2,
    leading=11.5,
    alignment=1,
    textColor=colors.HexColor("#0f766e"),
)
section_style = ParagraphStyle(
    "Section",
    parent=styles["Normal"],
    fontName=FONT_BOLD,
    fontSize=11,
    leading=14,
    textColor=colors.HexColor("#0f766e"),
    spaceBefore=7,
    spaceAfter=3,
)
job_style = ParagraphStyle(
    "Job",
    parent=styles["Normal"],
    fontName=FONT_BOLD,
    fontSize=9.4,
    leading=12,
    textColor=colors.HexColor("#111827"),
    spaceBefore=2,
    spaceAfter=1,
)
meta_style = ParagraphStyle(
    "Meta",
    parent=styles["Normal"],
    fontName=FONT,
    fontSize=8.2,
    leading=10.5,
    textColor=colors.HexColor("#4b5563"),
    spaceAfter=2,
)
body_style = ParagraphStyle(
    "Body",
    parent=styles["Normal"],
    fontName=FONT,
    fontSize=7.65,
    leading=10.2,
    firstLineIndent=-8,
    leftIndent=8,
    textColor=colors.HexColor("#111827"),
    spaceAfter=1.5,
)
skill_style = ParagraphStyle(
    "Skill",
    parent=styles["Normal"],
    fontName=FONT,
    fontSize=7.7,
    leading=10.3,
    firstLineIndent=-8,
    leftIndent=8,
    textColor=colors.HexColor("#111827"),
)


def add_section(story: list, title: str) -> None:
    story.append(p(title, section_style))


def add_role(story: list, title: str, meta: str, bullets: list[str]) -> None:
    story.append(p(title, job_style))
    story.append(p(meta, meta_style))
    for item in bullets:
        story.append(bullet(item, body_style))


def build() -> None:
    doc = SimpleDocTemplate(
        str(OUT),
        pagesize=A4,
        rightMargin=13 * mm,
        leftMargin=13 * mm,
        topMargin=11 * mm,
        bottomMargin=11 * mm,
        title="姜羽扬 - 字节AI数据与安全定制简历",
        author="姜羽扬",
    )
    story = []
    story.append(p("姜羽扬", name_style))
    story.append(p("18136104181 | yuyangj@kth.se", contact_style))
    story.append(Spacer(1, 3))
    story.append(p("AI 数据产品 / LLM 安全评测 / 数据生产链路 / 质量验收 / Agentic Workflow / Python", summary_style))
    story.append(p("关注大模型训练与评测数据的生产、质量验收和自动化流程搭建，具备 AI 产品设计、模型评估、数据分析与基础工程实现能力。", contact_style))

    add_section(story, "教育经历")
    education = Table(
        [
            [p("瑞典皇家理工学院｜通信工程 硕士", job_style), p("2024年08月 - 2026年11月｜瑞典斯德哥尔摩", meta_style)],
            [p("东南大学｜信息工程 本科", job_style), p("2020年09月 - 2024年06月｜南京", meta_style)],
        ],
        colWidths=[92 * mm, 77 * mm],
    )
    education.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0)]))
    story.append(education)

    add_section(story, "工作经历")
    add_role(
        story,
        "超级简历｜产品经理实习生",
        "2024年04月 - 2024年06月",
        [
            "围绕移动招聘与求职辅助场景开展竞品分析、用户需求研究和核心链路拆解，重点关注简历生成、岗位匹配、求职辅助等模块，输出竞品分析报告及产品优化方向。",
            "识别用户在“高效生成简历”“明确求职方向”等场景下的核心痛点，参与一页纸方案梳理、需求讨论和产品方案迭代，提升对 AI 求职辅助产品场景的理解。",
            "参与“性格测试 / 求职辅助”功能设计，完成高保真原型、结果页信息结构和关键交互流程；功能推送覆盖 7.5 万用户，结果页到达率 73.7%，带动 51 位用户完成职位投递。",
            "参与社区功能数据分析，跟踪内容浏览、互动、转化与留存表现；发现使用过社区功能的用户次周留存率较未使用用户高 15%，为社区价值判断和后续产品优化提供依据。",
        ],
    )
    add_role(
        story,
        "中国科学院空天信息创新研究院｜Java 工程师实习生",
        "2024年07月 - 2024年08月",
        [
            "参与智算框架相关研发工作，负责 Java 环境下部分模块的功能开发、接口逻辑实现、问题排查与功能验证，积累计算平台类系统的工程开发经验。",
            "使用 Java 8 Lambda、Stream API 优化部分数据处理与业务逻辑代码，参与缓存机制与接口逻辑优化，并完成接口联调、异常排查和功能验证。",
        ],
    )

    add_section(story, "项目经历")
    add_role(
        story,
        "大模型安全评测数据生产与质量验收 Workflow",
        "产品设计 / 数据策略 / Python 原型搭建｜2026年03月 - 至今",
        [
            "面向大模型安全评测场景，设计覆盖个人数据与隐私泄露、提示注入、有害行为、幻觉事实性、偏见公平性、不安全工具调用、数据合规与多模态上下文错配等 8 类风险的数据分类体系。",
            "定义评测样本 schema，包含风险类型、业务场景、用户 prompt、期望行为、严重度、难度、是否拒答及 judge rubric 等字段，支撑样本生产、规则校验和后续人工抽检。",
            "搭建“样本池 -> 实时模型响应 -> rubric judge -> 人审队列 / bad case -> 数据动作 -> 下一轮补样”的安全评测数据 Workflow，生成 32 条评测样本并输出质量验收报告。",
            "设计 schema 完整率、风险覆盖率、prompt 去重率、rubric 完整率、难度分布等质量门禁，并通过线上 dashboard 展示样本浏览、风险筛选、Recent Runs 和质量评估结果。",
            "补充 64 条候选模型输出与 rubric judge 流程，对 baseline 与 safety workflow 两组输出进行评测，沉淀 bad case 归因和“评测结果 -> 数据动作 -> 补样策略”的数据飞轮思路。",
            "通过 Vercel Serverless 接入模型 API，实现单样本实时安全评测，返回模型输出、judge 分数、延迟、usage 和推荐数据动作；密钥仅在服务端环境变量读取。",
            "项目链接：llm-safety-eval-workflow.vercel.app；github.com/yuyangjungle/llm-safety-eval-workflow",
        ],
    )
    add_role(
        story,
        "文本预处理技术对大语言模型性能影响的研究",
        "硕士毕业设计研究者｜2025年01月 - 2026年01月",
        [
            "围绕 LLM/NLP 任务中的数据处理与模型效果优化开展研究，评估不同文本预处理策略对模型性能、稳定性和泛化表现的影响。",
            "基于 DepressionEmo 多标签数据集搭建完整实验流程，完成文本清洗、预处理配置设计、训练/验证集划分、模型微调、结果汇总与误差分析。",
            "对 BERT、MPNet、GPT-2、T5 等模型，以及 Full Fine-tuning、LoRA、QLoRA 等参数高效微调方案进行对照实验，比较 Macro-F1、Micro-F1、Precision、Recall 等指标表现。",
            "使用 Python、PyTorch、Transformers、Pandas 完成实验配置、结果统计和可视化分析，沉淀模型评估、数据质量分析和实验复盘方法。",
        ],
    )
    add_role(
        story,
        "地图开放平台智能检索：自然语言到地图 API 调用的 AI Agent 原型",
        "产品设计 / AI Workflow 设计 / 原型搭建｜2026年03月 - 至今",
        [
            "面向开放平台开发者接入场景，设计“自然语言需求 -> 意图解析 -> 结构化 API 参数 -> Web Service 调用 -> POI 结果 -> AI 推荐总结”的 Agentic Workflow，验证 AI Agent 降低 API 使用门槛的可行性。",
            "将用户需求拆解为地点、关键词、半径、排序方式、使用场景等结构化字段，设计服务端 Agent Orchestrator，并调用高德开放平台 Web Service API 完成地理编码与周边 POI 检索。",
            "围绕开放平台产品稳定性与安全性，设计服务端密钥保护、参数校验、模型解析失败 fallback、地图 API 调用失败 fallback 等机制，保障异常场景下流程可继续运行。",
            "项目链接：amap-ai-agent-playground.vercel.app",
        ],
    )

    add_section(story, "专业技能")
    for item in [
        "产品能力：需求分析、竞品调研、PRD/MRD、用户流程设计、原型设计、数据分析、指标体系设计、跨团队协作",
        "AI / 数据：LLM、模型评测、样本生产、数据质量验收、Fine-tuning、LoRA、QLoRA、Prompt Workflow、Agentic Workflow、Pandas、数据清洗、实验结果分析",
        "技术能力：Python、Java、JavaScript、React、Vite、API 调用、后端接口联调、缓存机制、参数校验、fallback 机制",
        "技术理解：云计算、GPU 云服务、模型训练/推理流程、开发者工具、容器化、虚拟化、AI Infra",
    ]:
        story.append(bullet(item, skill_style))

    doc.build(story)
    print(OUT)


if __name__ == "__main__":
    build()
