import vertexai
from vertexai.generative_models import GenerativeModel

vertexai.init(
    project="project-b5ec2023-26c3-482a-99e",
    location="us-central1"
)

model = GenerativeModel("ggemini-2.5-flash-lite")

response = model.generate_content(
    "Explain IEEE citation format."
)

print(response.text)
