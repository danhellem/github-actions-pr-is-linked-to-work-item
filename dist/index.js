import './sourcemap-register.cjs';/******/ /* webpack/runtime/compat */
/******/ 
/******/ if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = new URL('.', import.meta.url).pathname.slice(import.meta.url.match(/^file:\/\/\/\w:/) ? 1 : 0, -1) + "/";
/******/ 
/************************************************************************/
var __webpack_exports__ = {};

var __createBinding = (undefined && undefined.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (undefined && undefined.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (undefined && undefined.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
        try {
            const context = github.context;
            const github_token = core.getInput('repo-token');
            const pull_request_number = (_b = (_a = context.payload.pull_request) === null || _a === void 0 ? void 0 : _a.number) !== null && _b !== void 0 ? _b : 0;
            const pull_request_description = (_d = (_c = context.payload.pull_request) === null || _c === void 0 ? void 0 : _c.body) !== null && _d !== void 0 ? _d : '';
            const ab_lookup_match = pull_request_description.match(/AB#([^ \]]+)/g);
            const repository_owner = (_f = (_e = context.payload.repository) === null || _e === void 0 ? void 0 : _e.owner.login) !== null && _f !== void 0 ? _f : '';
            const repository_name = (_h = (_g = context.payload.repository) === null || _g === void 0 ? void 0 : _g.name) !== null && _h !== void 0 ? _h : '';
            const sender_login = (_k = (_j = context.payload.sender) === null || _j === void 0 ? void 0 : _j.login) !== null && _k !== void 0 ? _k : '';
            let work_item_id = '';
            let last_comment_posted = { code: "", id: 0 };
            const octokit = github.getOctokit(github_token);
            console.log(sender_login);
            // if the sender in the azure-boards bot or dependabot, then exit code
            // nothing needs to be done
            if (sender_login === "dependabot[bot]") {
                console.log(`dependabot[bot] sender, exiting action.`);
                return;
            }
            if (context.eventName === 'pull_request') {
                last_comment_posted = yield getLastComment(octokit, repository_owner, repository_name, pull_request_number);
                console.log(`Last comment posted by action: ${last_comment_posted.code}`);
                // check if pull request description contains a AB#<work item number>
                console.log(`Checking description for AB#{ID} ...`);
                if (ab_lookup_match) {
                    for (const match of ab_lookup_match) {
                        work_item_id = match.substring(3);
                        break;
                    }
                    // Validate work_item_id is a valid integer
                    if (!/^\d+$/.test(work_item_id)) {
                        const errorMsg = `❌ Invalid work item number: AB#${work_item_id}. Work item number must be a valid integer.`;
                        console.log(errorMsg);
                        yield octokit.rest.issues.createComment(Object.assign(Object.assign({}, context.repo), { issue_number: pull_request_number, body: `${errorMsg}\n\n[Click here](https://learn.microsoft.com/en-us/azure/devops/boards/github/link-to-from-github?view=azure-devops#use-ab-mention-to-link-from-github-to-azure-boards-work-items) to learn more.\n\n<!-- code: lcc-416 -->` }));
                        core.setFailed(errorMsg);
                        return;
                    }
                    console.log(`AB#${work_item_id} found in pull request description.`);
                    console.log(`Checking to see if bot created link ...`);
                    // check if the description contains a link to the work item
                    if ((pull_request_description === null || pull_request_description === void 0 ? void 0 : pull_request_description.includes('[AB#')) && (pull_request_description === null || pull_request_description === void 0 ? void 0 : pull_request_description.includes('/_workitems/edit/'))) {
                        console.log(`Success: AB#${work_item_id} link found.`);
                        console.log('Done.');
                        // if the last comment is the check failed, now it passed and we can post a new comment
                        if (last_comment_posted.code !== "lcc-200" && sender_login === "azure-boards[bot]") {
                            // if the last check failed, then the azure-boards[bot] ran and passed, we can delete the last comment
                            if (last_comment_posted.code === "lcc-416" && sender_login === "azure-boards[bot]") {
                                console.log(`Deleting last comment posted by action: ${last_comment_posted.id}`);
                                yield octokit.rest.issues.deleteComment({
                                    owner: repository_owner,
                                    repo: repository_name,
                                    comment_id: last_comment_posted.id
                                });
                            }
                            yield octokit.rest.issues.createComment(Object.assign(Object.assign({}, context.repo), { issue_number: pull_request_number, body: `✅ Work item link check complete. Description contains link AB#${work_item_id} to an Azure Boards work item.\n\n<!-- code: lcc-200 -->` }));
                        }
                        return;
                    }
                    else {
                        // check if the description contains a link to the work item
                        console.log(`Bot did not create a link from AB#${work_item_id}`);
                        if (last_comment_posted.code !== "lcc-416" && sender_login !== "azure-boards[bot]") {
                            yield octokit.rest.issues.createComment(Object.assign(Object.assign({}, context.repo), { issue_number: pull_request_number, body: `❌ Work item link check failed. Description contains AB#${work_item_id} but the Bot could not link it to an Azure Boards work item.\n\n[Click here](https://learn.microsoft.com/en-us/azure/devops/boards/github/link-to-from-github?view=azure-devops#use-ab-mention-to-link-from-github-to-azure-boards-work-items) to learn more.\n\n<!--code: lcc-416-->` }));
                            core.setFailed(`Description contains AB#${work_item_id} but the Bot could not link it to an Azure Boards work item`);
                            return;
                        }
                        core.warning(`Description contains AB#${work_item_id} and waiting for the azure-boards[bot] to validate the link`);
                    }
                    return;
                }
                else {
                    if (last_comment_posted.code !== "lcc-404") {
                        yield octokit.rest.issues.createComment(Object.assign(Object.assign({}, context.repo), { issue_number: pull_request_number, body: `❌ Work item link check failed. Description does not contain AB#{ID}.\n\n[Click here](https://learn.microsoft.com/en-us/azure/devops/boards/github/link-to-from-github?view=azure-devops#use-ab-mention-to-link-from-github-to-azure-boards-work-items) to Learn more.\n\n<!-- code: lcc-404 -->` }));
                    }
                    core.setFailed('Description does not contain AB#{ID}');
                }
            }
        }
        catch (error) {
            if (error instanceof Error)
                core.setFailed(error.message);
        }
    });
}
function getLastComment(octokit, repository_owner, repository_name, pull_request_number) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        const last_comment_posted = { code: "", id: 0 };
        // get all comments for the pull request
        try {
            const response = yield octokit.rest.issues.listComments({
                owner: repository_owner,
                repo: repository_name,
                issue_number: pull_request_number,
            });
            // check for comments
            if (response.data.length > 0) {
                const comments = response.data.map((comment) => {
                    return {
                        id: comment.id,
                        created_at: new Date(comment.created_at),
                        body: comment.body
                    };
                });
                // sort comments by date descending
                comments.sort((a, b) => {
                    var _a, _b, _c, _d;
                    const aTime = (_b = (_a = a.created_at) === null || _a === void 0 ? void 0 : _a.getTime()) !== null && _b !== void 0 ? _b : 0;
                    const bTime = (_d = (_c = b.created_at) === null || _c === void 0 ? void 0 : _c.getTime()) !== null && _d !== void 0 ? _d : 0;
                    return bTime - aTime;
                });
                // loop through comments and grab the most recent comment posted by this action
                // we want to use this to check later so we don't post duplicate comments
                for (const comment of comments) {
                    last_comment_posted.id = (_a = comment.id) !== null && _a !== void 0 ? _a : 0;
                    if ((_b = comment.body) === null || _b === void 0 ? void 0 : _b.includes('lcc-404')) {
                        last_comment_posted.code = "lcc-404";
                        break;
                    }
                    if ((_c = comment.body) === null || _c === void 0 ? void 0 : _c.includes('lcc-416')) {
                        last_comment_posted.code = "lcc-416";
                        break;
                    }
                    if ((_d = comment.body) === null || _d === void 0 ? void 0 : _d.includes('lcc-200')) {
                        last_comment_posted.code = "lcc-200";
                        break;
                    }
                }
            }
        }
        catch (error) {
            console.log(error);
        }
        return last_comment_posted;
    });
}
run();


//# sourceMappingURL=index.js.map