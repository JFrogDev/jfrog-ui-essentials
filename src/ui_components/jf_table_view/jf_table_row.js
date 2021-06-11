class jfTableRowController {
	/* @ngInject */
    constructor($scope, $element, $timeout, JFrogEventBus) {
        this.$element = $element;
        this.$timeout = $timeout;
        this.$scope = $scope;
        this.JFrogEventBus = JFrogEventBus;
        this.EVENTS = JFrogEventBus.getEventsDefinition()

        $(this.$element).prop('ctrl', this);

    }

    $onInit() {
        this.templatesCount = _.filter(this.tableView.options.columns,col=>!!col.cellTemplate).length;

        this.JFrogEventBus.registerOnScope(this.$scope, this.EVENTS.TABLEVIEW_HIDE_ACTIONS_DROPDOWN, (tableView) => {
            if (tableView === this.tableView) this.actionsDropdownOpen = false
        });
        if (this.tableView.options.draggableRows) this.$timeout(()=>this.initDragAndDrop());
    }

    getField(field) {
        return _.get(this.data,field);
    }
    kebab(str) {
        return _.kebabCase(str);
    }
    toggleSelection(all) {
        if (!all && this.tableView.options.isRowSelectable && !this.tableView.options.isRowSelectable({entity: this.data})) return;

        if (!all) {
            if (this.tableView.options.selectionMode === this.tableView.options.MULTI_SELECTION) {
                this.data.$selected = !this.data.$selected;
                if (!this.data.$selected) {
                    this.tableView.allSelected = false;
                    if (this.tableView.options.groupedBy) {
                        let groupHeader = _.find(this.tableView.options.getPrePagedData(),{$groupHeader:{value: _.get(this.data,this.tableView.options.groupedBy)}})
                        if (groupHeader) groupHeader.$selected = false;
                    }
                }
                if (this.data.$groupHeader) this.tableView.groupSelection(this.data);
            }
            else if (this.tableView.options.selectionMode === this.tableView.options.SINGLE_SELECTION) {
                this.tableView.clearSelection();
                this.data.$selected = true;
            }
        }
        else {
            this.tableView.toggleSelectAll();
        }
	    this.tableView.options.fire('selection.change', this.tableView.options.getSelectedRows());

    }

    toggleGroupExpansion() {
        this.data.$groupHeader.$expanded = !this.data.$groupHeader.$expanded;
        this.tableView.options.updateGroupExpansionState(this.data);
    }

    fireAction(action) {
        action.callback(this.data);
        this.tableView.onUpdateFilter(false)
    }

    onMouseMove(e) {
        if (!this.resizingColumns) {
            if (this.hoveringResize && this.hoveringResize.left) delete this.hoveringResize.left.$dragRightBorder;
            if (this.hoveringResize && this.hoveringResize.right) delete this.hoveringResize.right.$dragLeftBorder;
            this.hoveringResize = this._getHoveringResizePoint(e);
        }
        else {
            this.dragColumnResize(e);
        }
    }

    dragColumnResize(e) {
        let MIN_WIDTH = 5; //percent
        let container = this._getTableContainer();
        let containerWidth = container.innerWidth();
        let mouseX = e.pageX - container.offset().left;
        let mouseXPerc = Math.round((mouseX / containerWidth) * 100);
        let offset = mouseXPerc - this.resizeDragStart;

        let newLeftWidth,newRightWidth;
        if (_.isString(this.hoveringResize.origLeftWidth) && this.hoveringResize.origLeftWidth.endsWith('%')) {
            newLeftWidth = (parseFloat(this.hoveringResize.origLeftWidth) + offset) + '%';
        }
        else if (_.isString(this.hoveringResize.origLeftWidth) && this.hoveringResize.origLeftWidth.endsWith('px')) {
            let perc = (parseFloat(this.hoveringResize.origLeftWidth)/containerWidth)*100;
            newLeftWidth = (perc + offset) + '%';
        }
        if (this.hoveringResize.right) {
            if (_.isString(this.hoveringResize.origRightWidth) && this.hoveringResize.origRightWidth.endsWith('%')) {
                newRightWidth = (parseFloat(this.hoveringResize.origRightWidth) - offset) + '%';
            }
            else if (_.isString(this.hoveringResize.origRightWidth) && this.hoveringResize.origRightWidth.endsWith('px')) {
                let perc = (parseFloat(this.hoveringResize.origRightWidth)/containerWidth)*100;
                newRightWidth = (perc - offset) + '%';
            }
        }

        if (parseFloat(newLeftWidth) > MIN_WIDTH && (!newRightWidth || parseFloat(newRightWidth) > MIN_WIDTH)) {
            this.hoveringResize.left.width = this.hoveringResize.left.origWidth = newLeftWidth;
            if (this.hoveringResize.right) this.hoveringResize.right.width = this.hoveringResize.right.origWidth = newRightWidth;
        }
    }

    onMouseDown(e) {
        if (this.hoveringResize) {
            let container = this._getTableContainer();
            let containerWidth = container.innerWidth();
            let mouseX = e.pageX - container.offset().left;
            let mouseXPerc = Math.round((mouseX / containerWidth) * 100);

            this.resizingColumns = true;
            this.resizeDragStart = mouseXPerc;

            this.hoveringResize.left.$dragRightBorder = true;
            if (this.hoveringResize.right) this.hoveringResize.right.$dragLeftBorder = true;
        }
    }
    onMouseUp(e) {
        if (this.hoveringResize && this.hoveringResize.left) delete this.hoveringResize.left.$dragRightBorder;
        if (this.hoveringResize && this.hoveringResize.right) delete this.hoveringResize.right.$dragLeftBorder;
        this.resizingColumns = false;
        delete this.resizeDragStart;
    }

    _getHoveringResizePoint(e) {
        let columns = this.tableView.options.columns;

        let container = this._getTableContainer();
        let containerWidth = container.innerWidth();
        let mouseX = e.pageX - container.offset().left;
        let mouseXPerc = Math.round((mouseX / containerWidth) * 100);

        let percCount = this.tableView.options.hasSelection() ? (this.tableView.options.selectionColumnWidth/containerWidth)*100 : 0;

        let hovering = false;

        for (let colI = 0; colI < columns.length; colI++) {
            let col = columns[colI];
            if (_.isString(col.width) && col.width.endsWith('%')) {
                percCount += parseFloat(col.width);
            }
            else if (_.isString(col.width) && col.width.endsWith('px')) {
                let perc = (parseFloat(col.width)/containerWidth)*100;
                percCount += perc;
            }
            if (Math.abs(percCount - mouseXPerc) <= .5) {
                hovering = {
                    left: col,
                    right: columns[colI+1],
                    origLeftWidth: col.width,
                    origRightWidth: columns[colI+1] ? columns[colI+1].width : undefined
                };
                break;
            }
        }

        return hovering;
    }

    _getTableContainer() {
        return $(this.tableView.$element).find('.jf-table-view-container');
    }

    onClickCell(col, event) {
	    if (!$(event.target).closest('.jf-table-row').hasClass('drag-mark')) {
	        event.stopPropagation();
	        return;
        }
	    //        event.stopPropagation();
        if (this.rowId === 'headers' && col.header && this.tableView.options.sortable && !this.hoveringResize && col.sortable) {
            this.tableView.options.sortBy(col.field);
        }
    }

    onRowClick($event) {
	    if (this.data.$groupHeader) {
	        this.toggleGroupExpansion()
	    }
	    else {
		    if (this.rowId !== 'headers') this.tableView.options.fire('row.clicked', {entity: this.data, event: $event});
        }
    }

    toggleExpansion($event) {
	    $event.stopPropagation();
        this.tableView.options.toggleExpansion(this.data);
    }

	toggleActionsDropdown(e) {
		e.stopPropagation();
		let origState = this.actionsDropdownOpen;
		this.JFrogEventBus.dispatch(this.EVENTS.TABLEVIEW_HIDE_ACTIONS_DROPDOWN, this.tableView);
		this.actionsDropdownOpen = !origState;
	}

    initDragAndDrop() {
        if (this.rowId === 'headers') return;

        $(this.$element).draggable({
            helper: 'clone',
            scroll: true,
            distance: 10,
            appendTo: $(this.tableView.$element).find('.jf-table-view-container'),
            start: (event, ui) => this.$scope.$apply(() => this.dragStart(event,ui)),
            stop: (event, ui) => this.$scope.$apply(() => this.dragStop(event,ui)),
            drag: (event, ui) => this.$scope.$apply(() => this.dragMove(event,ui))
        });
        $(this.$element).addClass('drag-enabled');
    }

    dragStart(event, ui) {
        if (this.tableView.options.registeredTabularDnd && this.tableView.options.registeredTabularDnd.dndCtrl.disabled) {
            event.preventDefault();
            return;
        }

        if (!this.isRowDraggable()) {

            event.preventDefault();
            return;
        }

        $('body').addClass('grabbing');
        this.tableView.options.dragRow(this.data);
        this.initDragHelper(ui.helper);
    }

    isRowDraggable() {
        if (this.tableView.options.registeredTabularDnd &&
            this.tableView.options.registeredTabularDnd.dndCtrl.itemDraggableAttr &&
            !_.isUndefined(this.data[this.tableView.options.registeredTabularDnd.dndCtrl.itemDraggableAttr]) &&
            !this.data[this.tableView.options.registeredTabularDnd.dndCtrl.itemDraggableAttr]) {

            return false;
        }
        else return true;
    }

    initDragHelper(helper) {
        helper.addClass('row-drag-helper');
        if (this.tableView.options.registeredTabularDnd) {
            let numOfDraggedRows = this.tableView.options.draggedRows ? this.tableView.options.draggedRows.length : 1;
            if (numOfDraggedRows > 1) {
                helper.addClass('multiple').html('<span>&equiv;</span>' + numOfDraggedRows + ' ' + this.tableView.getObjectNameByCount(numOfDraggedRows, this.tableView.options.registeredTabularDnd.dndCtrl.entityName || 'Item'));
            }
        }
    }

    dragStop(event, ui) {
        let draggedRowsArrayForDndEvent = this.tableView.options.draggedRow ? [this.tableView.options.draggedRow] : _.map(this.tableView.options.draggedRows, 'row');
        let target = $(event.originalEvent.target);
        target = target.is('.jf-table-row') ? target[0] : target.parents('.jf-table-row')[0];

	    $('body').removeClass('grabbing');

        let handleForeignDrop = (targetRow) => {
            this.tableView.options.registeredTabularDnd.dndOther.dropDraggedRow(targetRow, (this.tableView.options.draggedRow || this.tableView.options.draggedRows), true);
            this.tableView.options.markDropTarget(null);
            this.tableView.options.registeredTabularDnd.dndCtrl.onDragTransfer(draggedRowsArrayForDndEvent, this.tableView.options);
            delete this.tableView.options.draggedRow;
            delete this.tableView.options.draggedRows;
        }
        if (target) {
            if (this.isForeignDrop(target)) {
                handleForeignDrop($(target).prop('ctrl').data);
            }
            else {
                this.tableView.options.dropDraggedRow($(target).prop('ctrl').data);
            }
        }
        else {
            if (this.tableView.options.registeredTabularDnd) {
                if ($(event.originalEvent.target).is('.empty-table-placeholder') &&
                    $(event.originalEvent.target).parents('.jf-table-view')[0] !== $(this.tableView.$element).find('.jf-table-view')[0]) {

                    handleForeignDrop(null);

                }
                else {
                    let container = $(event.originalEvent.target).is('.tabular-dnd-table-container') ? $(event.originalEvent.target) : $(event.originalEvent.target).parents('.tabular-dnd-table-container');
                    let myRole = this.tableView.options.registeredTabularDnd.dndRole;

                    if (container && ( (container.is('.available-table') && myRole === 'selected') || (container.is('.selected-table') && myRole === 'available'))) {
                        handleForeignDrop(null);
                    }
                    else {
                        this.tableView.options.dropDraggedRow();
                    }

                }
            }
            else {
                this.tableView.options.dropDraggedRow();
            }
        }
    }

    handleScrollOnDrag(target, event) {
        if (this.tableView.options.paginationMode === this.tableView.options.VIRTUAL_SCROLL) {

            let tableView = this.tableView;

            if (this.tableView.options.registeredTabularDnd && target) {
                let rowCtrl = $(target).prop('ctrl');
                tableView = rowCtrl.tableView;
            }

            let container = $(tableView.$element).find('.table-rows-container');
            let containerY = container[0].getClientRects()[0].y;
            let relativeY = event.clientY - containerY;
            let containerHeight = container.height();

            let vsApi = tableView.vsApi;

            if (relativeY < 50) {
                vsApi.scroll(-.1 * (50 - relativeY));
            }
            else if (relativeY > containerHeight - 50) {
                vsApi.scroll(.1 * (50 - (containerHeight - relativeY)));
            }
        }

    }

    dragMove(event, ui) {

        let target = $(event.originalEvent.target);
        target = target.is('.jf-table-row') ? target[0] : target.parents('.jf-table-row')[0];

        this.handleScrollOnDrag(target, event);

        if (!target && $(event.originalEvent.target).is('.empty-table-placeholder')) target = event.originalEvent.target;

        if (target) {
            this.tableView.options.markDropTarget($(target));
        }
        else {
            this.tableView.options.markDropTarget(null);
        }
    }

    isForeignDrop(dropTarget) {
        if (!this.tableView.options.registeredTabularDnd) return false;
        else {
            let targetTableView = $(dropTarget).prop('ctrl') ? $(dropTarget).prop('ctrl').tableView : null;
            if (targetTableView && targetTableView.options === this.tableView.options.registeredTabularDnd.dndOther) return true;
            else return false;
        }
    }

    _getRowActionsWidth() {
        return this.tableView.options.getActionsContainerWidthInPixels() + 'px';
    }
}

export function jfTableRow() {
    return {
        controller: jfTableRowController,
        controllerAs: 'jfTableRow',
        bindToController: true,
        replace: true,
        scope: {
            data: '=',
            rowId: '=',
            tableView: '='
        },
        templateUrl: 'ui_components/jf_table_view/jf_table_row.html'
    }
}