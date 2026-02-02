from app.services.intelligence.llm_engine import generate_insight

async def analyze_risk(event: dict) -> dict:
    """
    Analyzes an incoming event (GitHub PR, Jira Ticket, Slack Msg) using Gemini
    to determine if it poses a risk to the project.
    """
    
    # 1. Select the Best Persona based on Source
    if event["source"] == "github":
        persona = "You are a Senior Staff Engineer. Look for breaking API changes, security flaws, risky dependencies, or lack of tests."
    elif event["source"] == "jira":
        persona = "You are a Technical Product Manager. Look for vague requirements, scope creep, sudden priority spikes, or unrealistic deadlines."
    elif event["source"] == "slack":
        persona = "You are an Agile Delivery Lead. Look for signs of team blocking, miscommunication, delays, or frustration."
    else:
        persona = "You are a Project Risk Analyst."

    # 2. Construct the System Prompt
    system_instruction = f"""
    {persona}
    
    Your task is to analyze the following project event and determine if it requires attention.
    
    Output strictly in this JSON format:
    {{
        "is_risky": boolean,
        "risk_score": integer (1-10),
        "reason": "A concise, one-sentence explanation of the risk.",
        "action_needed": "A short, actionable recommendation for the team."
    }}
    
    Rules:
    - If risk_score < 4, set is_risky to false.
    - If code changes involve database schemas, authentication, or payments, risk_score must be at least 8.
    - Be concise.
    """

    # 3. Construct the User Content (The Data)
    user_content = f"""
    Event Source: {event['source']}
    Action: {event['action']}
    Actor: {event['actor']}
    Summary: {event['summary']}
    
    Full Content/Diff/Message:
    {event['content']}
    """

    # 4. Call the Shared LLM Engine
    try:
        # We use the generic wrapper we built in llm_engine.py
        analysis = await generate_insight(system_instruction, user_content)
        return analysis

    except Exception as e:
        print(f"⚠️ Risk Analyzer Error: {e}")
        # Fail safe (Default to safe so we don't spam alerts on errors)
        return {
            "is_risky": False,
            "risk_score": 0,
            "reason": "AI Analysis temporarily unavailable",
            "action_needed": "Manual review recommended"
        }