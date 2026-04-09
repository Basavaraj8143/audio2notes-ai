# Contribution Guidelines for audio2notes-ai

Welcome to the **audio2notes-ai** project! We are excited to have you contributing to our GenAI project. Please follow these guidelines to help us maintain quality contributions.

## Table of Contents
1. [Setup Instructions](#setup-instructions)
2. [Coding Standards](#coding-standards)
3. [Pull Request Process](#pull-request-process)

## Setup Instructions
To get started with the project, follow these setup instructions:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Basavaraj8143/audio2notes-ai.git
   cd audio2notes-ai
   ```

2. **Set up a virtual environment** (Python):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use `venv\Scripts\activate`
   ```

3. **Install the necessary dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **For JavaScript and frontend setup**:
   * Navigate to the client directory and run:
   ```bash
   npm install
   ```

5. **Build the project** (if applicable):
   ```bash
   npm run build
   ```

## Coding Standards
To maintain consistency in the codebase, adhere to the following coding standards:

- **Python**: Follow [PEP 8](https://www.python.org/dev/peps/pep-0008/) guidelines for Python code.
- **JavaScript**: Use [ESLint](https://eslint.org/) to enforce coding styles.
- **CSS**: Stick to BEM methodology for CSS class naming.
- **HTML**: Ensure HTML5 semantics; use meaningful tags and attributes.

## Pull Request Process
1. **Creating a branch**: Always create a new branch for your feature or fix:
   ```bash
   git checkout -b my-feature-branch
   ```

2. **Make your changes**: Implement your feature or bug fix. Ensure to test thoroughly.

3. **Commit your changes**: Write clear and concise commit messages:
   ```bash
   git commit -m "Add new feature to X"
   ```

4. **Push to your branch**:
   ```bash
   git push origin my-feature-branch
   ```

5. **Create a Pull Request**: Go to the repository on GitHub and create a Pull Request. Provide a clear description of your changes and why they are beneficial to the project.

6. **Review Process**: Your PR will be reviewed by a maintainer. Be open to feedback and make necessary adjustments.

7. **Merge**: Once approved, your changes will be merged into the main branch. You may also be asked to merge into different branches or make additional commits.

Thank you for contributing! Together, we can make audio2notes-ai better.