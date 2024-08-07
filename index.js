import { format, parseISO } from "date-fns";

const DATE_FORMAT = "LLLL dd, yyyy";

const head = `# {lang} Web Frameworks
A list of popular GitHub projects related to {lang} web frameworks (ranked by stars)\n

| Framework | Stars | Forks | Open Issues | Description | Last Update | License |
| --------- | ----- | ----- | ----------- | ----------- | ----------- | ------- |
`;
const tail = "*Last Update*: ";
const warning = "⚠️ No longer maintained ⚠️";

const getJSON = (token) => {
  return async (url) => {
    return fetch(url, {
      headers: {
        Authorization: `token ${token}`,
        "User-Agent":
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36",
        accept: "application/vnd.github.v3+json",
      },
    }).then((response) => response.json());
  };
};

const buildReadme = async (frameworks, lang, token) => {
  const now = format(
    new Date().toLocaleString("en", { timeZone: "UTC" }),
    "'UTC' HH:mm" + ", " + DATE_FORMAT,
  );
  const fetchJSON = getJSON(token);
  const repos = [];
  return Promise.all(
    frameworks.map(async (framework) => {
      try {
        const repoURL = `https://api.github.com/repos/${framework}`;
        const repo = await fetchJSON(repoURL);
        const commits = await fetchJSON(
          `${repoURL}/commits/${repo.default_branch}`,
        );

        repo.lastCommitDate = commits?.commit?.committer?.date;
        repos.push(repo);
      } catch (error) {
        console.error(error);
      }
    }),
  )
    .then(() =>
      repos
        .sort((a, b) => a.stargazers_count - b.stargazers_count)
        .reverse()
        .map((repo) =>
          [
            "|",
            [
              `[${repo.full_name.toLowerCase()}](${repo.html_url.toLowerCase()})`,
              `${repo.stargazers_count}`,
              `${repo.forks}`,
              `${repo.open_issues}`,
              `${(repo.archived ? warning + " " : "") + repo.description}`,
              `${format(parseISO(repo.lastCommitDate), DATE_FORMAT)}`,
              `${repo.license?.name || ""}`,
            ].join(" | "),
            "|",
          ].join(" "),
        )
        .join(`\n`),
    )
    .then((table) =>
      `${head}${table}\n\n${tail}${now}`.replaceAll("{lang}", lang),
    );
};

export default buildReadme;
