from openai import OpenAI

# Initialize client with OpenRouter's URL and your actual API key
client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key="#0#",  # Paste your OpenRouter key directly
)

def test_prompt():
    prompt_text = "Explain the concept of an adaptive feedback loop in education in 2 simple sentences."

    response = client.chat.completions.create(
        model="openrouter/free",  # Specific free model on OpenRouter
        messages=[
            {"role": "system", "content": "You are a helpful educational assistant."},
            {"role": "user", "content": prompt_text}
        ]
    )

    answer = response.choices[0].message.content
    print("AI Response:")
    print("----------------------------------------")
    print(answer)
    print("----------------------------------------")

if __name__ == "__main__":
    test_prompt()
