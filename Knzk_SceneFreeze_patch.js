//=============================================================================
// Knzk_SceneFreeze_patch.js
//=============================================================================
/*:
 * @plugindesc Queue up the changeScene Requests and execute them in order
 * @author Souji Kenzaki
 *
 * 
 *
 * @help 
 * This is a response to the MV 1.6.0 patch.
 * As the patch did not resolve the root cause and caused a lot of side effect, this is an attempt to resolve the root cause 
 * of "What will happen when scene change happens before previous one resolves?"
 * 
 * When you introduce this patch, it will cause those scene change requests to be queued until previous one resolved.
 * As this somewhat changes how the scene change is processed, please use with care. 
 */

/*:ja
 * @plugindesc シーン変更が多重で呼ばれた際、それを順番に実行できるようにする
 * @author 剣崎宗二
 *
 *
 * @help 
 * MV 1.6.0への修正、及び新規機能の追加パッチとなります。
 * 該当のバージョンはフリーズバグの根本的な原因を修正せず、尚且つ新たな問題を差し込んだため、このパッチはそれを是正します。
 * 
 * 該当のフリーズバグの根本的な原因は「前のシーン遷移が完了しないまま次のシーン遷移が発生した際、どうなるか？」
 * ですので、このパッチはその際「キューにシーン遷移リクエストを累積し、順番に（前のシーンを正しく終了させた後）実行する」と言う手段を取っております。
 * 根本的にシーン遷移の仕組みを変更する為、
 * 使用時は十分にご注意ください。
 */

(function(){
SceneManager._loadingQueue            = [];
SceneManager._sceneStopped            = false;

SceneManager.goto = function(sceneClass) {
    if (sceneClass) {
        this._loadingQueue.push(new sceneClass());
    }
};

SceneManager.prepareSceneChange = function() {
    if (this.isCurrentSceneStarted() && this.isSceneChanging() && !this._sceneStopped) {
        this._scene.stop();
        this._sceneStopped = true;
    }
}

SceneManager.loadSceneFromQueue = function() {
    if (!this._nextScene && this._loadingQueue.length > 0) {
        this._nextScene = this._loadingQueue.shift();
    }
}

SceneManager.isSceneStartPerformed = function() {
    return !this._scene || this._sceneStarted;
}

SceneManager.updateMain = function() {
    if (Utils.isMobileSafari()) {
        this.loadSceneFromQueue();
        this.prepareSceneChange();
        this.changeScene();
        this.updateScene();
    } else {
        var newTime = this._getTimeInMsWithoutMobileSafari();
        var fTime = (newTime - this._currentTime) / 1000;
        if (fTime > 0.25) fTime = 0.25;
        this._currentTime = newTime;
        this._accumulator += fTime;
        while (this._accumulator >= this._deltaTime) {
            this.updateInputData();
            this.loadSceneFromQueue();
            this.prepareSceneChange();
            this.changeScene();
            this.updateScene();
            this._accumulator -= this._deltaTime;
        }
    }
    this.renderScene();
    this.requestUpdate();
};

SceneManager.changeScene = function() {
    if (this.isSceneChanging() && !this.isCurrentSceneBusy() && this.isSceneStartPerformed()) {
        if (this._scene) {
            this._scene.terminate();
            this._scene.detachReservation();
            this._previousClass = this._scene.constructor;
        }
        this._scene = this._nextScene;
        this._nextScene = null;
        if (this._scene) {
            this._scene.attachReservation();
            this._scene.create();
            this._sceneStarted = false;
            this._sceneStopped = false;
            this.onSceneCreate();
        }
        if (this._exiting) {
            this.terminate();
        }
    }
};

//以下、1.6.0の状態で入れられたための際のリセットfunction

Scene_Item.prototype.update = function() {
    Scene_ItemBase.prototype.update.call(this);
    // if (this._categoryWindow.active !== true && this._itemWindow.active !== true && this._actorWindow.active !== true) {
    //     this._categoryWindow.activate();
    // }
};

})();