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
