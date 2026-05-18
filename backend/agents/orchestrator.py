import os
from typing import TypedDict, Annotated
from dotenv import load_dotenv
load_dotenv()  # Load environment variables from .env file

from langchain_groq import ChatGroq 
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode

from backend.tools.ml_tools import (
    compute_risk_logistic,
    compute_risk_knn,
    compute_risk_mlp,
    summarise_cohort,
)
from backend.agents.rag import retrieve_context

TOOLS = [compute_risk_logistic, compute_risk_knn, compute_risk_mlp, summarise_cohort]

SYSTEM_PROMPT = """You are a clinical AI assistant for diabetes risk analysis.

You have 3 ML tools: compute_risk_logistic, compute_risk_knn, compute_risk_mlp, and summarise_cohort.

Rules:
- Use ML tools when asked about specific patient risk.
- Always report: risk score, risk level, top 3 factors.
- Ground answers in tool outputs only — no hallucinated numbers.
- For cohort questions, use summarise_cohort tool.
"""


class AgentState(TypedDict):
    messages: Annotated[list, "conversation history"]
    context:  str


def build_agent():
    llm = ChatGroq(model="llama-3.1-8b-instant", temperature=0)
    model = llm.bind_tools(TOOLS)

    def retrieve_node(state: AgentState) -> AgentState:
        last_user_msg = next(
            (m.content for m in reversed(state["messages"]) if isinstance(m, HumanMessage)),
            ""
        )
        context = retrieve_context(last_user_msg)
        return {**state, "context": context}

    def agent_node(state: AgentState) -> AgentState:
        system = SystemMessage(content=SYSTEM_PROMPT + f"\n\nRetrieved patient context:\n{state['context']}")
        response = model.invoke([system] + state["messages"])
        return {**state, "messages": state["messages"] + [response]}

    def should_continue(state: AgentState) -> str:
        last = state["messages"][-1]
        if hasattr(last, "tool_calls") and last.tool_calls:
            return "tools"
        return END

    tool_node = ToolNode(TOOLS)

    def tool_wrapper(state: AgentState) -> AgentState:
        result = tool_node.invoke(state)
        return {**state, "messages": result["messages"]}

    graph = StateGraph(AgentState)
    graph.add_node("retrieve",  retrieve_node)
    graph.add_node("agent",     agent_node)
    graph.add_node("tools",     tool_wrapper)

    graph.set_entry_point("retrieve")
    graph.add_edge("retrieve", "agent")
    graph.add_conditional_edges("agent", should_continue, {"tools": "tools", END: END})
    graph.add_edge("tools", "agent")

    return graph.compile()


# Single shared instance
_agent = None

def get_agent():
    global _agent
    if _agent is None:
        _agent = build_agent()
    return _agent


def run_query(question: str, history: list[dict] = []) -> str:
    """
    Run a query through the agent.
    history: list of {"role": "user"|"assistant", "content": "..."}
    Returns the assistant's final text response.
    """
    agent = get_agent()

    messages = []
    for msg in history:
        if msg["role"] == "user":
            messages.append(HumanMessage(content=msg["content"]))
        else:
            messages.append(AIMessage(content=msg["content"]))
    messages.append(HumanMessage(content=question))

    result   = agent.invoke({"messages": messages, "context": ""})
    last_msg = result["messages"][-1]
    return last_msg.content
