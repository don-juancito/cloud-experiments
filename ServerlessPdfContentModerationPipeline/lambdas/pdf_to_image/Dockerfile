FROM public.ecr.aws/lambda/python:3.13

# Copy function code
COPY pdf_to_image_transformer.py ${LAMBDA_TASK_ROOT}

# Install additional system dependencies
RUN dnf install poppler-utils -y

# Install Python dependencies
COPY requirements.txt ${LAMBDA_TASK_ROOT}
RUN pip install -r requirements.txt

# Set the CMD to your handler (could also be done as a parameter override outside of the Dockerfile)
CMD [ "pdf_to_image_transformer.handler" ]