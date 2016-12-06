Contributing Information
========================

First, _thank you_ for wanting to contribute to gulp-ssh-deploy. This should serve as a brief guide to contributing to the project. If you have any questions, please feel free to send a message to [@jwir3](mailto:jaywir3@gmail.com) for more information.

Contact Information
-------------------
  - [Slack Channel](slack://channel?id=C3BLNSYKY&team=T33DNEFHN) (Preferred)
  - [Email](mailto:jaywir3@gmail.com)
  - [Twitter](https://twitter.com/jwir3)

Workflow
---------

In general, we use [git-flow](http://nvie.com/posts/a-successful-git-branching-model/) to complete our development. If you aren't a developer, don't worry too much about this. We can work with you to ensure that your contributions are accepted either over email or via another mechanism. [@jwir3](http://github.com/jwir3) (the founder of this project) is happy to mentor you in any way possible. If you are a developer, and aren't familiar with git-flow, we encourage you to read the aforementioned article, since it is used at a number of different development companies, and will likely be useful to you in your career.

We use Waffle.io to track progress toward a release. You can view our waffle board [here](https://waffle.io/jwir3/gulp-ssh-deploy).

### Release Overview
We always have a set of milestones, but the number will vary. There is an ongoing "Backlog" milestone that we use to track issues that we'd like to do, but aren't currently planned for a release. Other milestones are planned releases. Once a ticket is placed into a release milestone (typically there will only be one of these active at a time, the next release), the ticket will be moved into the "Ready" column on Waffle. Any ticket in the "Ready" state is fair game to be taken.

As a ticket is completed, a pull request should be created. Once this happens, the ticket will be automatically moved to the code review state. Code review can be performed by any of our core developers, but most commonly it's done by @jwir3. Code review will more than likely consist of a series of comments asking for minor changes, after which the pull request will be merged into the `develop` branch by one of our core developers. The ticket the pull request is associated with will then be closed.

When all tickets in a release milestone are closed, the `develop` branch will be merged into `master`, a tag will be created for the release, and release binaries will be generated.

### Detailed Workflow Process
The following is what you should do to start working on a ticket:
1. Fork the gulp-ssh-deploy repository.
2. Create a branch called `<type>/#XX-brief-description` where `<type>` is the type of the ticket (e.g. "enhancement, documentation, task, bug, etc..."), `XX` is the ticket number, and  `brief description` is a brief description (no more than 4 or 5 words, separated by `-`) of what you plan to fix in the ticket.
3. Make your changes to the code. Each commit should be as small as possible, self-contained, independently compilable, and related to the ticket. Commit messages should be in the imperative tense, have no more than 80 characters in their summary line, and include a reference to the ticket being fixed. See [How to Write a Git Commit Message](http://chris.beams.io/posts/git-commit/) for more information.
4. Submit a pull request from your branch to the `develop` branch of `jwir3/gulp-ssh-deploy`. Please fill in the relevant information to the best of your ability. If you aren't including something in the checklist (e.g. you didn't include tests for your new feature), explain why in the pull request body. Prior to submitting your pull request, please rebase your branch to the tip of `develop` branch of `jwir3/gulp-ssh-deploy` and resolve any merge conflicts.
5. The pull request will be assigned to one of our core developers, who will review it. Typically, there are minor changes that are requested, which can be addressed with follow-up commits. Once the review is passed, the developer reviewing your code will automatically merge your commit into `develop`.

Competency-Based Tasks
----------------------
The following is a list of tasks that can be performed by anyone with competency in specific areas. Please note that the flag `help-wanted` typically indicates a great starting point for those of you who may be new to the gulp-ssh-deploy project.

Also, if you don't have competency in a specific area (e.g. development), but would like to learn competency in that area, please don't hesitate to contact us so we can mentor you.

### Developers
[![Stories in Ready](https://badge.waffle.io/jwir3/gulp-ssh-deploy.svg?label=ready&title=Ready)](http://waffle.io/jwir3/gulp-ssh-deploy)

Any ticket in the ready state can be picked up by a developer. If you're interested in a specific ticket, please comment on that ticket to indicate your interest, and it will be assigned to you. If you want to work on a ticket that isn't in the current release, please comment on it, and more than likely we'll add it to the current release. You can click the above badge to find all of the tickets in the ready state.

### Package Maintainers
We need package maintainers for the npm package.

### Others
[![Documentation Stories](https://badge.waffle.io/jwir3/gulp-ssh-deploy.svg?label=documentation&title=Documentation)](http://waffle.io/jwir3/gulp-ssh-deploy

Anything marked with the `documentation` label typically requires some technical writing. It might include code comments, but this is somewhat rare. We are in desperate need of good user documentation, and will probably need a wiki at some point on how to use the gulp-ssh-deploy software tool.
