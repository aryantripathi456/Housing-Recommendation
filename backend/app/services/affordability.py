def evaluate_affordability(rent: int, monthly_income: int) -> dict:
    ratio = rent / monthly_income if monthly_income > 0 else 999

    if ratio <= 0.30:
        label = "Affordable"
        advice = "This property is well within your budget. You'll have sufficient savings for other expenses."
    elif ratio <= 0.35:
        label = "Moderate Risk"
        advice = "This property is at the upper edge of comfortable affordability. Consider if the liveability and commute benefits justify the stretch."
    else:
        label = "Over Budget"
        advice = f"This property costs {ratio*100:.0f}% of your income, exceeding the recommended 30% threshold. Consider a more affordable option or negotiate rent."

    return {
        "rent_to_income_ratio": round(ratio * 100, 2),
        "label": label,
        "advice": advice,
    }
