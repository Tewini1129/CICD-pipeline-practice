import { useState } from "react";
import "./App.css";

type Phase = "lesson" | "test" | "memory";

type Level = {
  title: string;
  description: string;
  lessonCode: string;
  solution: string;
  explanation: string;
};

const levels: Level[] = [
  {
    title: "Level 1 — Trigger the Pipeline",

    description:
      "Every GitHub Actions workflow needs to know when it should start. Learn how to trigger a workflow whenever code is pushed to the main branch.",

    lessonCode: `on:
  push:
    branches:
      - main`,

    solution: `on:
  push:
    branches:
      - main`,

    explanation:
      "The 'on' section defines when the workflow runs. Here, a push to the main branch starts the pipeline.",
  },

  {
    title: "Level 2 — Create a Job",

    description:
      "A workflow contains jobs. Create a job called 'build', configure it to run on Ubuntu, and create its steps section.",

    lessonCode: `jobs:
  build:
    runs-on: ubuntu-latest
    steps:`,

    solution: `jobs:
  build:
    runs-on: ubuntu-latest
    steps:`,

    explanation:
      "The 'jobs' section contains the work your pipeline performs. The build job runs on an Ubuntu runner and contains the steps that will execute.",
  },

  {
    title: "Level 3 — Checkout the Repository",

    description:
      "The runner needs your repository's source code before it can build or test anything. Use the GitHub checkout action. Give the step a descriptive name so it is easy to identify in the Actions UI.",

    lessonCode: `- name: Checkout
  uses: actions/checkout@v4`,

    solution: `- name: Checkout
  uses: actions/checkout@v4`,

    explanation:
      "The 'name' property gives the step a human-readable name. 'uses' tells GitHub Actions to use an existing action. The checkout action downloads your repository onto the runner.",
  },

  {
    title: "Level 4 — Install Dependencies",

    description:
      "Before building a Node/React application, install its dependencies. Give the step a descriptive name and then run npm install.",

    lessonCode: `- name: Install dependencies
  run: npm install`,

    solution: `- name: Install dependencies
  run: npm install`,

    explanation:
      "The 'run' keyword executes a command on the runner. Giving the step a name makes the pipeline easier to understand when looking at the GitHub Actions interface.",
  },

  {
    title: "Level 5 — Build the Application",

    description:
      "Now build your application using the build script from package.json. Again, give the step a descriptive name.",

    lessonCode: `- name: Build application
  run: npm run build`,

    solution: `- name: Build application
  run: npm run build`,

    explanation:
      "npm run build executes the project's build script and creates the production build.",
  },

  {
    title: "Level 6 — Run Tests",

    description:
      "A CI pipeline should test the application before it is deployed. Add a named test step.",

    lessonCode: `- name: Run tests
  run: npm test`,

    solution: `- name: Run tests
  run: npm test`,

    explanation:
      "Running tests allows the pipeline to catch problems before the application reaches deployment.",
  },

  {
    title: "Level 7 — Create the Deploy Job",

    description:
      "Create a second job called 'deploy'. Make it wait until the build job succeeds.",

    lessonCode: `deploy:
  needs: build
  runs-on: ubuntu-latest
  steps:`,

    solution: `deploy:
  needs: build
  runs-on: ubuntu-latest
  steps:`,

    explanation:
      "The 'needs' property creates a dependency. The deploy job waits for the build job to finish successfully.",
  },

  {
    title: "Level 8 — Deploy",

    description:
      "The final step is deployment. Give it a descriptive name and run the deployment command.",

    lessonCode: `- name: Deploy application
  run: npm run deploy`,

    solution: `- name: Deploy application
  run: npm run deploy`,

    explanation:
      "This represents your deployment stage. In a real Azure pipeline, this could instead use an Azure deployment action.",
  },
];

/* ============================================================
   PIPELINE GENERATION

   Generates exactly what the player has learned.

   completedLevels = 2:
   Level 1 + Level 2

   completedLevels = 4:
   Level 1 + Level 2 + Level 3 + Level 4

   IMPORTANT:
   Checkout does NOT appear until Level 3 has
   actually been completed.
============================================================ */

function getPipelineForCompletedLevels(
  completedLevels: number
): string {
  let pipeline = "";

  if (completedLevels >= 1) {
    pipeline += `on:
  push:
    branches:
      - main`;
  }

  if (completedLevels >= 2) {
    pipeline += `

jobs:
  build:
    runs-on: ubuntu-latest
    steps:`;
  }

  if (completedLevels >= 3) {
    pipeline += `
      - name: Checkout
        uses: actions/checkout@v4`;
  }

  if (completedLevels >= 4) {
    pipeline += `
      - name: Install dependencies
        run: npm install`;
  }

  if (completedLevels >= 5) {
    pipeline += `
      - name: Build application
        run: npm run build`;
  }

  if (completedLevels >= 6) {
    pipeline += `
      - name: Run tests
        run: npm test`;
  }

  if (completedLevels >= 7) {
    pipeline += `

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:`;
  }

  if (completedLevels >= 8) {
    pipeline += `
      - name: Deploy application
        run: npm run deploy`;
  }

  return pipeline;
}

/* ============================================================
   YAML STRUCTURAL NORMALIZER

   We don't compare the raw strings.

   This means harmless differences such as:

   Windows line endings
   Trailing spaces
   Blank lines

   won't cause a false failure.

   The actual YAML hierarchy still matters.
============================================================ */

type ParsedLine = {
  indent: number;
  content: string;
};

function parseYamlStructure(code: string): ParsedLine[] {
  return code
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map((line) => ({
      indent: line.length - line.trimStart().length,
      content: line.trim(),
    }));
}

function yamlMatches(
  userCode: string,
  expectedCode: string
): boolean {
  const user = parseYamlStructure(userCode);
  const expected = parseYamlStructure(expectedCode);

  if (user.length !== expected.length) {
    return false;
  }

  for (let i = 0; i < expected.length; i++) {
    /*
     * The actual YAML content on this line must match.
     */
    if (user[i].content !== expected[i].content) {
      return false;
    }

    /*
     * Compare the indentation RELATIONSHIP rather than
     * requiring an exact number of spaces.
     *
     * Example:
     *
     * jobs:
     *   build:
     *
     * and
     *
     * jobs:
     *     build:
     *
     * both represent the same parent/child relationship.
     */

    if (i === 0) {
      continue;
    }

    const userPreviousIndent = user[i - 1].indent;
    const expectedPreviousIndent = expected[i - 1].indent;

    const userIndentDifference =
      user[i].indent - userPreviousIndent;

    const expectedIndentDifference =
      expected[i].indent - expectedPreviousIndent;

    /*
     * Same level.
     */
    if (
      userIndentDifference === 0 &&
      expectedIndentDifference !== 0
    ) {
      return false;
    }

    /*
     * User went deeper, expected didn't.
     */
    if (
      userIndentDifference > 0 &&
      expectedIndentDifference <= 0
    ) {
      return false;
    }

    /*
     * User went back, expected didn't.
     */
    if (
      userIndentDifference < 0 &&
      expectedIndentDifference >= 0
    ) {
      return false;
    }
  }

  return true;
}

/* ============================================================
   APP
============================================================ */

function App() {
  const [currentLevel, setCurrentLevel] = useState(0);

  const [phase, setPhase] =
    useState<Phase>("lesson");

  const [code, setCode] = useState("");

  const [result, setResult] = useState<
    "correct" | "wrong" | null
  >(null);

  const [errorMessage, setErrorMessage] = useState("");

  const [completed, setCompleted] = useState(false);

  /* ==========================================================
     START LEVEL TEST
  ========================================================== */

  function startLevelTest() {
    setPhase("test");
    setCode("");
    setResult(null);
    setErrorMessage("");
  }

  /* ==========================================================
     START MEMORY TEST
  ========================================================== */

  function startMemoryTest(completedLevels: number) {
    setCurrentLevel(completedLevels);

    setPhase("memory");

    setCode("");

    setResult(null);

    setErrorMessage("");
  }

  /* ==========================================================
     LEVEL COMPLETED
  ========================================================== */

  function levelCompleted() {
    const completedLevels = currentLevel + 1;

    /*
     * Every two completed levels:
     * start a memory test.
     */

    if (
      completedLevels % 2 === 0 &&
      completedLevels < levels.length
    ) {
      startMemoryTest(completedLevels);
      return;
    }

    /*
     * All levels completed.
     */

    if (completedLevels >= levels.length) {
      setCompleted(true);
      return;
    }

    /*
     * Move to the next lesson.
     */

    setCurrentLevel(completedLevels);

    setPhase("lesson");

    setCode("");

    setResult(null);

    setErrorMessage("");
  }

  /* ==========================================================
     CHECK INDIVIDUAL LEVEL
  ========================================================== */

  function checkLevelAnswer() {
    const expected =
      levels[currentLevel].solution;

    if (yamlMatches(code, expected)) {
      setResult("correct");

      setTimeout(() => {
        levelCompleted();
      }, 700);

      return;
    }

    setResult("wrong");

    setErrorMessage(
      getLevelError(
        code,
        currentLevel
      )
    );
  }

  /* ==========================================================
     CHECK MEMORY TEST
  ========================================================== */

  function checkMemoryAnswer() {
    const completedLevels = currentLevel;

    const expected =
      getPipelineForCompletedLevels(
        completedLevels
      );

    if (yamlMatches(code, expected)) {
      setResult("correct");

      setTimeout(() => {
        const nextLevel = completedLevels;

        if (nextLevel >= levels.length) {
          setCompleted(true);
          return;
        }

        setCurrentLevel(nextLevel);

        setPhase("lesson");

        setCode("");

        setResult(null);

        setErrorMessage("");
      }, 800);

      return;
    }

    setResult("wrong");

    setErrorMessage(
      getMemoryError(
        code,
        completedLevels
      )
    );
  }

  /* ==========================================================
     INDIVIDUAL LEVEL ERROR
  ========================================================== */

  function getLevelError(
    submitted: string,
    levelIndex: number
  ): string {
    const user =
      parseYamlStructure(submitted);

    if (user.length === 0) {
      return "You didn't enter any YAML.";
    }

    if (levelIndex === 0) {
      if (
        !user.some(
          (x) => x.content === "on:"
        )
      ) {
        return "You're missing 'on:'. This defines when the workflow starts.";
      }

      if (
        !user.some(
          (x) => x.content === "push:"
        )
      ) {
        return "You're missing 'push:'.";
      }

      if (
        !user.some(
          (x) => x.content === "branches:"
        )
      ) {
        return "You're missing 'branches:'.";
      }

      if (
        !user.some(
          (x) => x.content === "- main"
        )
      ) {
        return "The workflow needs to trigger on the main branch.";
      }

      return "The YAML structure doesn't match the required structure.";
    }

    if (levelIndex === 1) {
      if (
        !user.some(
          (x) => x.content === "jobs:"
        )
      ) {
        return "You're missing the 'jobs:' section.";
      }

      if (
        !user.some(
          (x) => x.content === "build:"
        )
      ) {
        return "You need a job called 'build'.";
      }

      if (
        !user.some(
          (x) =>
            x.content ===
            "runs-on: ubuntu-latest"
        )
      ) {
        return "The build job needs 'runs-on: ubuntu-latest'.";
      }

      if (
        !user.some(
          (x) => x.content === "steps:"
        )
      ) {
        return "You're missing the 'steps:' section.";
      }

      return "The job structure or indentation is incorrect.";
    }

    if (levelIndex === 2) {
      if (
        !user.some(
          (x) =>
            x.content ===
            "- name: Checkout"
        )
      ) {
        return "You're missing '- name: Checkout'. Give the step a descriptive name.";
      }

      if (
        !user.some(
          (x) =>
            x.content ===
            "uses: actions/checkout@v4"
        )
      ) {
        return "You're missing 'uses: actions/checkout@v4'.";
      }

      return "The Checkout step is present, but its structure or indentation is incorrect.";
    }

    if (levelIndex === 3) {
      if (
        !user.some(
          (x) =>
            x.content ===
            "- name: Install dependencies"
        )
      ) {
        return "You're missing the 'Install dependencies' step name.";
      }

      if (
        !user.some(
          (x) =>
            x.content ===
            "run: npm install"
        )
      ) {
        return "You need to run 'npm install'.";
      }

      return "The dependency installation step is structured incorrectly.";
    }

    if (levelIndex === 4) {
      if (
        !user.some(
          (x) =>
            x.content ===
            "- name: Build application"
        )
      ) {
        return "You're missing the 'Build application' step name.";
      }

      if (
        !user.some(
          (x) =>
            x.content ===
            "run: npm run build"
        )
      ) {
        return "You need to run 'npm run build'.";
      }

      return "The build step is structured incorrectly.";
    }

    if (levelIndex === 5) {
      if (
        !user.some(
          (x) =>
            x.content ===
            "- name: Run tests"
        )
      ) {
        return "You're missing the 'Run tests' step name.";
      }

      if (
        !user.some(
          (x) =>
            x.content ===
            "run: npm test"
        )
      ) {
        return "You need to run 'npm test'.";
      }

      return "The test step is structured incorrectly.";
    }

    if (levelIndex === 6) {
      if (
        !user.some(
          (x) =>
            x.content === "deploy:"
        )
      ) {
        return "You need to create the 'deploy' job.";
      }

      if (
        !user.some(
          (x) =>
            x.content === "needs: build"
        )
      ) {
        return "The deploy job needs 'needs: build'.";
      }

      return "The deploy job structure is incorrect.";
    }

    if (levelIndex === 7) {
      if (
        !user.some(
          (x) =>
            x.content ===
            "- name: Deploy application"
        )
      ) {
        return "You're missing the 'Deploy application' step name.";
      }

      if (
        !user.some(
          (x) =>
            x.content ===
            "run: npm run deploy"
        )
      ) {
        return "You need to run 'npm run deploy'.";
      }

      return "The deployment step is structured incorrectly.";
    }

    return "The YAML structure is incorrect.";
  }

  /* ==========================================================
     MEMORY TEST ERROR
  ========================================================== */

  function getMemoryError(
    submitted: string,
    completedLevels: number
  ): string {
    const user =
      parseYamlStructure(submitted);

    if (user.length === 0) {
      return "You submitted an empty pipeline.";
    }

    /*
     * Level 1
     */

    if (
      completedLevels >= 1 &&
      !user.some(
        (x) => x.content === "on:"
      )
    ) {
      return "You forgot the workflow trigger from Level 1.";
    }

    /*
     * Level 2
     */

    if (
      completedLevels >= 2 &&
      !user.some(
        (x) => x.content === "jobs:"
      )
    ) {
      return "You forgot the 'jobs:' section from Level 2.";
    }

    if (
      completedLevels >= 2 &&
      !user.some(
        (x) => x.content === "build:"
      )
    ) {
      return "You forgot the 'build' job from Level 2.";
    }

    if (
      completedLevels >= 2 &&
      !user.some(
        (x) =>
          x.content ===
          "runs-on: ubuntu-latest"
      )
    ) {
      return "You forgot 'runs-on: ubuntu-latest' from Level 2.";
    }

    if (
      completedLevels >= 2 &&
      !user.some(
        (x) => x.content === "steps:"
      )
    ) {
      return "You forgot 'steps:' from Level 2.";
    }

    /*
     * Level 3
     *
     * Notice that BOTH name and uses are
     * required now.
     */

    if (
      completedLevels >= 3 &&
      !user.some(
        (x) =>
          x.content ===
          "- name: Checkout"
      )
    ) {
      return "You forgot '- name: Checkout' from Level 3.";
    }

    if (
      completedLevels >= 3 &&
      !user.some(
        (x) =>
          x.content ===
          "uses: actions/checkout@v4"
      )
    ) {
      return "You forgot 'uses: actions/checkout@v4' from Level 3.";
    }

    /*
     * Level 4
     */

    if (
      completedLevels >= 4 &&
      !user.some(
        (x) =>
          x.content ===
          "- name: Install dependencies"
      )
    ) {
      return "You forgot the 'Install dependencies' step name from Level 4.";
    }

    if (
      completedLevels >= 4 &&
      !user.some(
        (x) =>
          x.content ===
          "run: npm install"
      )
    ) {
      return "You forgot 'run: npm install' from Level 4.";
    }

    /*
     * Level 5
     */

    if (
      completedLevels >= 5 &&
      !user.some(
        (x) =>
          x.content ===
          "- name: Build application"
      )
    ) {
      return "You forgot the 'Build application' step name from Level 5.";
    }

    if (
      completedLevels >= 5 &&
      !user.some(
        (x) =>
          x.content ===
          "run: npm run build"
      )
    ) {
      return "You forgot 'run: npm run build' from Level 5.";
    }

    /*
     * Level 6
     */

    if (
      completedLevels >= 6 &&
      !user.some(
        (x) =>
          x.content ===
          "- name: Run tests"
      )
    ) {
      return "You forgot the 'Run tests' step name from Level 6.";
    }

    if (
      completedLevels >= 6 &&
      !user.some(
        (x) =>
          x.content ===
          "run: npm test"
      )
    ) {
      return "You forgot 'run: npm test' from Level 6.";
    }

    /*
     * Level 7
     */

    if (
      completedLevels >= 7 &&
      !user.some(
        (x) =>
          x.content === "deploy:"
      )
    ) {
      return "You forgot the deploy job from Level 7.";
    }

    if (
      completedLevels >= 7 &&
      !user.some(
        (x) =>
          x.content === "needs: build"
      )
    ) {
      return "You forgot 'needs: build' from Level 7.";
    }

    /*
     * Level 8
     */

    if (
      completedLevels >= 8 &&
      !user.some(
        (x) =>
          x.content ===
          "- name: Deploy application"
      )
    ) {
      return "You forgot the 'Deploy application' step name from Level 8.";
    }

    if (
      completedLevels >= 8 &&
      !user.some(
        (x) =>
          x.content ===
          "run: npm run deploy"
      )
    ) {
      return "You forgot 'run: npm run deploy' from Level 8.";
    }

    return "The pipeline structure or indentation is incorrect.";
  }

  /* ==========================================================
     CONTINUE AFTER FAILURE

     As requested:
     WRONG → SHOW TERMINAL → CONTINUE → LEVEL 1
  ========================================================== */

  function continueAfterError() {
    setCurrentLevel(0);

    setPhase("lesson");

    setCode("");

    setResult(null);

    setErrorMessage("");
  }

  /* ==========================================================
     RESTART
  ========================================================== */

  function restartGame() {
    setCurrentLevel(0);

    setPhase("lesson");

    setCode("");

    setResult(null);

    setErrorMessage("");

    setCompleted(false);
  }

  /* ==========================================================
     TAB SUPPORT
  ========================================================== */

  function handleEditorKeyDown(
    event: React.KeyboardEvent<HTMLTextAreaElement>
  ) {
    if (event.key !== "Tab") {
      return;
    }

    event.preventDefault();

    const textarea = event.currentTarget;

    const start = textarea.selectionStart;

    const end = textarea.selectionEnd;

    const newCode =
      code.substring(0, start) +
      "  " +
      code.substring(end);

    setCode(newCode);

    requestAnimationFrame(() => {
      textarea.selectionStart =
        start + 2;

      textarea.selectionEnd =
        start + 2;
    });
  }

  /* ==========================================================
     COMPLETION SCREEN
  ========================================================== */

  if (completed) {
    return (
      <div className="game">

        <div className="game-card completion-card">

          <div className="completion-icon">
            🚀
          </div>

          <div className="eyebrow">
            PIPELINE SUCCESS
          </div>

          <h1>
            CI/CD Pipeline Complete!
          </h1>

          <p className="completion-description">
            You successfully built the entire
            pipeline and passed all memory tests.
          </p>

          <div className="completed-levels">

            {levels.map(
              (level, index) => (
                <div
                  className="completed-level"
                  key={level.title}
                >

                  <span className="completed-check">
                    ✓
                  </span>

                  <div>

                    <small>
                      LEVEL {index + 1}
                    </small>

                    <strong>
                      {level.title}
                    </strong>

                  </div>

                </div>
              )
            )}

          </div>

          <button
            className="primary-button"
            onClick={restartGame}
          >
            Start Again
          </button>

        </div>

      </div>
    );
  }

  /* ==========================================================
     MAIN DISPLAY
  ========================================================== */

  const displayLevel =
    phase === "memory"
      ? currentLevel
      : currentLevel + 1;

  return (
    <div className="game">

      <div className="game-card">

        <header className="header">

          <div>

            <div className="eyebrow">
              CI/CD TRAINING
            </div>

            <h1>
              Pipeline Builder
            </h1>

            <p>
              Learn it. Write it. Remember it.
            </p>

          </div>

          <div className="level-counter">

            <span>
              PROGRESS
            </span>

            <strong>
              {displayLevel}
              <small>
                /{levels.length}
              </small>
            </strong>

          </div>

        </header>

        <div className="progress-container">

          <div
            className="progress"
            style={{
              width:
                `${(displayLevel / levels.length) * 100}%`,
            }}
          />

        </div>

        <main>

          {/* ==================================================
              LESSON
          ================================================== */}

          {phase === "lesson" && (
            <section className="lesson">

              <div className="step-label">
                STEP {currentLevel + 1}
              </div>

              <h2>
                {levels[currentLevel].title}
              </h2>

              <p className="description">
                {levels[currentLevel].description}
              </p>

              <div className="learn-box">

                <div className="box-title">
                  📖 LEARN THIS
                </div>

                <p className="learn-description">
                  Study the code below. You will
                  need to reproduce it yourself.
                </p>

                <div className="code-example">

                  <div className="code-header">

                    <span>
                      .github/workflows/ci.yml
                    </span>

                    <span>
                      YAML
                    </span>

                  </div>

                  <pre>
                    {levels[currentLevel].lessonCode}
                  </pre>

                </div>

                <div className="explanation">

                  <strong>
                    What does it do?
                  </strong>

                  <p>
                    {levels[currentLevel].explanation}
                  </p>

                </div>

              </div>

              <button
                className="primary-button understand-button"
                onClick={startLevelTest}
              >
                OK, I Understand →
              </button>

            </section>
          )}

          {/* ==================================================
              INDIVIDUAL TEST
          ================================================== */}

          {phase === "test" && (
            <section className="test">

              <div className="step-label">
                TEST — LEVEL {currentLevel + 1}
              </div>

              <h2>
                Now write it yourself
              </h2>

              <p className="description">
                Without looking at the lesson,
                write the YAML required for this
                level.
              </p>

              <Editor
                code={code}
                setCode={setCode}
                onKeyDown={
                  handleEditorKeyDown
                }
                placeholder="Write your YAML here..."
              />

              <button
                className="primary-button check-button"
                onClick={
                  checkLevelAnswer
                }
                disabled={!code.trim()}
              >
                ▶ Check Answer
              </button>

              {result === "correct" && (
                <div className="feedback correct">

                  <div className="feedback-icon">
                    ✓
                  </div>

                  <div>

                    <strong>
                      Correct!
                    </strong>

                    <p>
                      Loading the next stage...
                    </p>

                  </div>

                </div>
              )}

            </section>
          )}

          {/* ==================================================
              MEMORY TEST
          ================================================== */}

          {phase === "memory" && (
            <section className="full-test">

              <div className="memory-test-banner">
                🧠 MEMORY TEST
              </div>

              <div className="step-label">
                REBUILD WHAT YOU KNOW
              </div>

              <h2>
                Write the entire pipeline
              </h2>

              <p className="description">
                You've completed{" "}
                <strong>
                  {currentLevel}
                </strong>{" "}
                levels.

                <br />

                Rebuild everything you've learned
                up to this point from memory.
              </p>

              <div className="memory-info">

                <div>

                  <span>
                    COMPLETED
                  </span>

                  <strong>
                    LEVELS 1–{currentLevel}
                  </strong>

                </div>

                <div>

                  <span>
                    REMEMBER
                  </span>

                  <strong>
                    EVERYTHING SO FAR
                  </strong>

                </div>

              </div>

              <Editor
                code={code}
                setCode={setCode}
                onKeyDown={
                  handleEditorKeyDown
                }
                full
                placeholder="Rebuild the pipeline from memory..."
              />

              <button
                className="primary-button check-button"
                onClick={
                  checkMemoryAnswer
                }
                disabled={!code.trim()}
              >
                🚀 Submit Full Pipeline
              </button>

              {result === "correct" && (
                <div className="feedback correct">

                  <div className="feedback-icon">
                    ✓
                  </div>

                  <div>

                    <strong>
                      Memory Test Passed!
                    </strong>

                    <p>
                      You remembered everything.
                    </p>

                  </div>

                </div>
              )}

            </section>
          )}

        </main>

        <footer>

          <span>
            GitHub Actions Training
          </span>

          <span>
            Memory test every 2 levels
          </span>

        </footer>

      </div>

      {/* ======================================================
          FAILURE TERMINAL
      ====================================================== */}

      {result === "wrong" && (
        <div className="modal-overlay">

          <div className="terminal-window">

            <div className="terminal-header">

              <div className="terminal-buttons">

                <span />
                <span />
                <span />

              </div>

              <div className="terminal-title">
                pipeline-validator
              </div>

            </div>

            <div className="terminal-content">

              <div className="terminal-command">

                <span className="terminal-green">
                  user@pipeline
                </span>

                <span className="terminal-white">
                  :~$
                </span>{" "}
                github-actions-validator
                ci.yml

              </div>

              <div className="terminal-failed">
                ✗ PIPELINE FAILED
              </div>

              <div className="terminal-message">
                {errorMessage}
              </div>

              <div className="terminal-section">

                <div className="terminal-section-title terminal-red">
                  YOUR CODE
                </div>

                <TerminalCode
                  code={code}
                />

              </div>

              <div className="terminal-section">

                <div className="terminal-section-title terminal-green-text">
                  EXPECTED CODE
                </div>

                <TerminalCode
                  code={
                    phase === "memory"
                      ? getPipelineForCompletedLevels(
                          currentLevel
                        )
                      : levels[
                          currentLevel
                        ].solution
                  }
                />

              </div>

              <div className="terminal-error">

                <span className="terminal-red">
                  ERROR:
                </span>

                <span>
                  {errorMessage}
                </span>

              </div>

              <div className="terminal-prompt">

                <span className="terminal-green">
                  user@pipeline
                </span>

                <span className="terminal-white">
                  :~$
                </span>

                <span className="terminal-cursor">
                  _
                </span>

              </div>

              <button
                className="terminal-continue"
                onClick={
                  continueAfterError
                }
              >
                CONTINUE — RESTART FROM LEVEL 1
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

/* ============================================================
   EDITOR
============================================================ */

type EditorProps = {
  code: string;
  setCode: (value: string) => void;
  onKeyDown: (
    event: React.KeyboardEvent<HTMLTextAreaElement>
  ) => void;
  placeholder: string;
  full?: boolean;
};

function Editor({
  code,
  setCode,
  onKeyDown,
  placeholder,
  full = false,
}: EditorProps) {
  const lineCount = Math.max(
    code.split("\n").length,
    1
  );

  return (
    <div className="editor">

      <div className="editor-top">

        <div className="window-buttons">

          <span />
          <span />
          <span />

        </div>

        <span>
          .github/workflows/ci.yml
        </span>

      </div>

      <div
        className={
          full
            ? "editor-body full-editor"
            : "editor-body"
        }
      >

        <div className="line-numbers">

          {Array.from(
            {
              length: lineCount,
            },
            (_, index) => (
              <div key={index}>
                {index + 1}
              </div>
            )
          )}

        </div>

        <textarea
          autoFocus
          value={code}
          onChange={(event) =>
            setCode(
              event.target.value
            )
          }
          onKeyDown={onKeyDown}
          spellCheck={false}
          placeholder={placeholder}
        />

      </div>

      <div className="editor-bottom">

        <span>
          YAML
        </span>

        <span>
          UTF-8
        </span>

      </div>

    </div>
  );
}

/* ============================================================
   TERMINAL CODE
============================================================ */

function TerminalCode({
  code,
}: {
  code: string;
}) {
  return (
    <div className="terminal-code">

      {code ? (
        code
          .split("\n")
          .map(
            (line, index) => (
              <div
                className="terminal-line"
                key={index}
              >

                <span className="terminal-line-number">
                  {String(
                    index + 1
                  ).padStart(2, "0")}
                </span>

                <span>
                  {line || " "}
                </span>

              </div>
            )
          )
      ) : (
        <div className="terminal-empty">
          [no code submitted]
        </div>
      )}

    </div>
  );
}

export default App;