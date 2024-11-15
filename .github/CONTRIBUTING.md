# Contributing Guide

Welcome to the contributing guide!

This guide exists to help BIDS users to contribute to the BIDS validator with
their own code. We cover:

1. Knowledge that might be helpful to have (or acquire)
1. How to set up your development environment for BIDS validator
1. Ways to contribute code to BIDS validator (e.g., for a BIDS extension
   proposal)

If you find that something is unclear, please open an [issue](https://github.com/bids-standard/bids-validator/issues)
so that we can improve this guide.

## Knowledge that will help you along the way

### Git

We use [`git`][link_git] for source control.
If you're not yet familiar with `git`, there are lots of great resources to help you
get started!
Some of our favorites include the [git Handbook][link_handbook] and
the [Software Carpentry introduction to git][link_swc_intro].

In particular, you will want to become conversant with the following operations:

- [`git clone`](https://git-scm.com/docs/git-clone)
- [`git branch`](https://git-scm.com/docs/git-branch)
- [`git checkout`](https://git-scm.com/docs/git-checkout)
- [`git status`](https://git-scm.com/docs/git-status)
- [`git pull`](https://git-scm.com/docs/git-pull)
- [`git add`](https://git-scm.com/docs/git-add)
- [`git commit`](https://git-scm.com/docs/git-commit)
- [`git push`](https://git-scm.com/docs/git-push)

You should also configure [configure git for your
user](https://git-scm.com/book/en/v2/Customizing-Git-Git-Configuration), so your commits
are properly attributed.

### GitHub

We use [GitHub](https://github.com) to manage contributions and have development
discussions in the open.
To participate, be sure you know how to

- [Fork the repository][link_fork]
- [Open pull requests][link_pullrequest]

### Coding knowledge

- Familiarize yourself with the command line on your system (e.g., `bash`)
- Basic knowledge about coding is helpful and familiarity with JavaScript
  is a big bonus, but you can contribute to the BIDS validator also without
  specific knowledge of JavaScript
- Some knowledge about software testing (why we are doing it) would be nice

## Using the development version of BIDS validator

1. [Make a GitHub account][link_signupinstructions]
1. Install the required software:
   - [git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)
   - [Deno](https://deno.com/)
1. In the GitHub interface, [make a fork][link_fork] of
   https://github.com/bids-standard/bids-validator to your own user (called `USER` for the
   sake of the example)
   - you will now have your own copy of BIDS validator at https://github.com/USER/bids-validator
1. Open a command line and navigate to the location on your computer from where
   you want to develop BIDS validator and [clone][link_clone] **your**
   fork of the repository
   - You will now have a new directory called `bids-validator`
   - navigate to that directory and run `git status` to verify that it's a `git`
     directory
1. Install `bids-validator` with: `deno install -Agf --reload ./bids-validator/src/bids-validator.ts`
   - Deno will install the file to its `bin` directory. On Unix systems,
     this should be `$HOME/.deno/bin`. You may need to add this to your `PATH`.

Now your development version of BIDS validator is set up and you can use it.
Whenever you _checkout_ a new branch in your git repository, the
`bids-validator` executable is now pointing to that branch, and all changes in
that branch will be reflected in the behavior of `bids-validator`.

Before you start making changes, there are some more important points to
consider:

1. We need to tell **your** git directory, that it has a _remote_
   counterpart (namely, the original BIDS validator). When that counterpart
   gets updated, you have to update your BIDS validator as well, to keep in
   sync.
   - run `git remote add upstream https://github.com/bids-standard/bids-validator`
   - then run `git remote -v`, and it should show four entries: two of type
     `origin`, and two of type `upstream`
   - `origin` refers to **your** fork of BIDS validator on GitHub, whereas
     `upstream` refers to the original BIDS validator repository on GitHub
   - you can use `upstream` to always stay up to date with changes that are
     being made on the original BIDS validator. For that, simply navigate to
     the `main` branch of **your** repository using `git checkout main`,
     and then run `git pull upstream main`
1. When you get completely stuck with your repository and you just want to
   reset it to be an exact mirror of the original BIDS validator, you can
   run the following command (Note: this will discard all current changes):
   - first checkout your main: `git checkout main`
   - then run: `git reset --hard upstream/main`

## Developing for the validator

When proposing a feature or bug fix, you must decide which branch you will target:
`main` or `dev`.
In most cases you will want `main`, but read below to understand the purposes of
the two branches.

### Branching policy

The BIDS Validator's `main` branch tracks the most recent release version of the specification:
<https://bids-specification.readthedocs.io/en/stable/>.
Pull requests made against the `main` branch should implement features or fix bugs in a way
that preserves consistency with the stable specification.

The `dev` branch is for features that are not yet in the released version of the BIDS
specification.
The purpose of this branch is to verify that proposed rules can be validated and
provide users with preview access to upcoming changes to the validator, increasing the chances
of catching issues with the specification or the validator, prior to release.
Changes to the `dev` branch may be reverted at any time.

### How to prepare a pull request for your target branch

If you're going to target `main`, then start as follows:

```console
git fetch upstream
git switch -c feat/short-desc upstream/main
```

This will create a new branch named `feat/short-desc`
(use `fix/...` for bug-fix branches, `doc/...` for documentation, etc.) starting
from the current state of the `main` branch on the `upstream` remote.
Instead of `short-desc`, use a few words to make the content of your branch
easily identifiable.

Once you have changes committed and ready for review you can run:

```console
git push -u origin feat/short-desc
```

GitHub will then give you a link such as:
<https://github.com/bids-standard/bids-validator/compare/master...username:bids-validator:feat/short-desc?expand=1>.
Follow that link to create a pull request.

While you are creating the pull request, verify that the base branch is set to `main`.

For `dev`, the process is identical:

```console
git fetch upstream
git switch -c feat/short-desc upstream/dev
# Add your feature
git push -u origin feat/short-desc
```

Open PR, set base branch to `dev`.

### Conventions for branches, commits and changelogs

The following conventions are intended to make contributions legible to other contributors
and, ultimately, users.
They are also there to help you, as a contributor, focus on doing one task at a time.

The following are common types of contributions, sorted roughly by order of interest
to the reader:

| Contribution type | Branch prefix | Commit prefix | Changelog section       |
|-------------------|---------------|---------------|-------------------------|
| Bug fix           | `fix/`        | `fix:`        | Fixed                   |
| Feature           | `feat/`       | `feat:`       | Added                   |
| Documentation     | `doc/`        | `doc:`        | Added or Infrastructure |
| Refactor          | `rf/`         | `rf:`         | Changed                 |
| Testing           | `test/`       | `test:`       | Changed                 |
| Style-only        | `sty/`        | `style:`      | Infrastructure          |
| Maintenance       | `chore/`      | `chore:`      | Infrastructure          |

If you are contributing a bug-fix, it can help focus your efforts to name your branch
`fix/problem-with-X`, and start commit messages where you write fixes with `fix:`.
Similarly, branches and commits that focus on features, documentation, refactors,
and so on, all have prefixes that help your reader understand what you were trying to do.

If you find your contribution spanning more than one of these sections,
it might be worth breaking into multiple pull requests.
Exceptions include tests and documentation relevant to the main thrust of the PR,
which are always welcome.

None of this is set in stone, and we all make mistakes, so don't worry about
following it to the letter.
We will let you know if your contribution is doing too many things and work with
you to split it into more manageable pieces.

#### Changelog entries

We are using the [scriv] changelog management tool to help keep our changelog organized.

Most pull requests will deserve changelog entries, and some may deserve more than one.
Scriv allows changelog entries to be made as part of the pull request, which gives
the contributor and the reviewer a chance to consider the impact of the pull request.

To add an entry, run:

```
scriv create --edit
```

(If you're wondering how to install `scriv`, we recommend using [uvx scriv][].)

Your editor will open a Markdown file with commented sections.
Find the appropriate section(s) for your contribution and write a 1-3 line description.

#### Style contributions

Style changes in code can be a source of frustration.
Some editors will reformat entire files when a single line is changed,
swamping the meaningful change with a large number of cosmetic changes.

We have provided a [`.editorconfig`](https://editorconfig.org) file in the repository,
which should be respected by [most editors](https://editorconfig.org/#pre-installed),
and there are plugins available for [others](https://editorconfig.org/#download).
Additionally, we use `deno fmt` to format the code in this repository.
Using an autoformatter like this helps avoid (ongoing) disagreements over style preferences
so we can focus on the content of the work.

Even with these, it is possible that when you go to commit your changes,
you have changed more than you intended to.
One reason this can happen is that we might have forgetten to autoformat our code.

One tool for this situation is `git add --patch` (or `-p`).
This tool shows you each change in turn, allowing you to decide whether or not to
"stage" the change. Stage only the chunks containing the pieces you meant to change,
and commit those. You can then `git checkout .` to discard the remaining changes.

It is sometimes unavoidable to reformat large portions of code.
In these cases, please make a style-only commit,
followed by a commit with the meaningful changes.
This will speed up review significantly.

Overall, a style-only pull request should be a rare event,
typically when adopting or upgrading an autoformatter.
This will generally have the effect of introducing merge conflicts,
so we may refrain from doing it for a while.
If you're feeling the urge, it's best to ask!


[link_git]: https://git-scm.com/
[link_handbook]: https://guides.github.com/introduction/git-handbook/
[link_swc_intro]: http://swcarpentry.github.io/git-novice/
[link_signupinstructions]: https://help.github.com/articles/signing-up-for-a-new-github-account
[link_pullrequest]: https://help.github.com/articles/creating-a-pull-request-from-a-fork
[link_fork]: https://help.github.com/articles/fork-a-repo/
[link_clone]: https://help.github.com/articles/cloning-a-repository
[conventional commits]: https://www.conventionalcommits.org/en/v1.0.0/
[git blame]: https://docs.github.com/en/repositories/working-with-files/using-files/viewing-a-file#viewing-the-line-by-line-revision-history-for-a-file
[scriv]: https://scriv.readthedocs.io/en/latest/
[uvx]: https://docs.astral.sh/uv/guides/tools/
