export function jfListMaker() {

    return {
        restrict: 'E',
        scope: {
            values: '=',
            label: '@',
            helpTooltip: '=',
            objectName: '@',
            ngDisabled: '=',
            noSort: '=?',
            minLength: '@',
            inputType: '@?',
            predefinedValues: '=?',
            placeholder: '@?',
            listId: '@',
            onAddValue: '&?',
	        onAfterAddValue: '&?',
	        onAfterDeleteValue: '&?',
            hideAddNewFields: '@',
            validationRegex:'@',
            validationRegexMessage:'@',
	        caseInsensitive: '<?',
	        required: '=?ngRequired'
        },
        templateUrl: 'directives/jf_list_maker/jf_list_maker.html',
        controller: jfListMakerController,
        controllerAs: 'jfListMaker',
        bindToController: true
    }
}

/**
 * API for the jfDragDrop directive
 */
class jfListMakerController {
    /* @ngInject */
    constructor($attrs, $scope) {
        this.$attrs = $attrs;
        this.$scope = $scope;
    }

    $onInit() {
        this.$scope.$watch('jfListMaker.values.length',() => {
	        this.validateIsRequired(this.values);
        });

        this.noSort = this.noSort || this.$attrs.hasOwnProperty('noSort');
        if (this.values && !this.noSort) this.values = _.sortBy(this.values);
        this.minLength = this.minLength || 0;

        let randomId = Math.floor(1000000000*Math.random());
        if (!this.listId) this.listId = 'list-id-' + randomId;
    }

    addValue() {

        if (!this.values) this.values = [];

        this.errorMessage = null;



        if (_.isEmpty(this.newValue)) {
            this.errorMessage = "Must input value";
        }
        else if (!this._isValueUnique(this.newValue)) {
            this.errorMessage = "Value already exists";
        }
        else if(!_.isEmpty(this.validationRegex) && !(new RegExp(this.validationRegex).test(this.newValue))){
            this.errorMessage= _.isEmpty(this.validationRegexMessage) ? "Value not valid" : this.validationRegexMessage;
        }

        else {
            if(this.onAddValue){
                this.newValue = this.onAddValue({newValue: this.newValue})
            }
            this.values.push(this.newValue);
            this.newValue = null;
	        if(this.onAfterAddValue){
		        this.onAfterAddValue()
	        }
        }
        if (!this.noSort) {
            this.values = _.sortBy(this.values);
        }
    }

    removeValue(index) {
        this.values.splice(index,1);

        if(this.onAfterDeleteValue && typeof this.onAfterDeleteValue === 'function') {
		    this.onAfterDeleteValue();
	    }
    }

    _isValueUnique(text) {
        if(this.caseInsensitive) {
            return !this.values || !_.find(this.values, (val) => {
                return val.toLowerCase() === text.toLowerCase();
            });
        }
        return !this.values || this.values.indexOf(text) == -1;
    }

    isRequired(valuesArray) {
        return this.required && (_.isUndefined(valuesArray) || _.isEmpty(valuesArray));
    }

    validateIsRequired(values) {
	    if(this.isRequired(values)) {
            if(this.listMakerForm && this.listMakerForm.newValueField) {
	            this.listMakerForm.newValueField.$setValidity("mustAddValueTolist", false);
            } else {
	            this.errorMessage = "You must add a value to list";
            }
	    } else {
		    if(this.listMakerForm && this.listMakerForm.newValueField) {
			    this.listMakerForm.newValueField.$setValidity("mustAddValueTolist", true);
            }
		    this.errorMessage = null;
	    }
    }

	onNewValueFieldChange() {
        this.validateIsRequired(this.values)
    }
}